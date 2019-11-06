import Ephemeris from '../Ephemeris'
import { util } from '../utilities/util'

export const motionEventObject = ({utcDate, apparentLongitude, nextMovementAmount, interval}={}) => {
  return ({
    date: utcDate,
    apparentLongitude,
    nextMovementAmount,
    interval
  })
}

export const getDirectedDate = ({direction = 'next', unit = 'date', utcDate}={}) => {
  // Given a date object, returns next [date or minute] or prev [date or minute] in new date object
  if (!['next', 'prev'].includes(direction)) throw new Error(`Please pass in direction from the following: 'next' or 'prev'. Not "${direction}".`)
  if (!['date', 'hour', 'minute', 'second'].includes(unit)) throw new Error(`Please pass in unit from the following: 'date', 'hour', 'minute', or 'second'. Not "${unit}".`)

  const newDate = util.cloneUTCDate(utcDate)
  const directionIncrement = direction === 'next' ? 1 : -1

  if (unit === 'date') {
    newDate.setUTCDate(utcDate.getUTCDate() + directionIncrement)
  } else if (unit === 'hour') {
    newDate.setUTCHours(utcDate.getUTCHours() + directionIncrement)
  } else if (unit === 'minute') {
    newDate.setUTCMinutes(utcDate.getUTCMinutes() + directionIncrement)
  } else if (unit === 'second') {
    newDate.setUTCSeconds(utcDate.getUTCSeconds() + directionIncrement)
  }

  return newDate
}

const getCurrentMovementAmount = (bodyKey, utcDate, currentApparentLongitude) => {
  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  return getApparentLongitudeDifference(currentApparentLongitude, getApparentLongitude(bodyKey, getDirectedDate({direction: "next", unit: "second", utcDate})))
}

const isRetrograde = movementAmount => {
  return movementAmount <= 0
}

const isDirect = movementAmount => {
  return movementAmount >= 0
}

export const getApparentLongitude = (bodyKey, utcDate) => {
  // Lat / lng / height does not matter in determining apparent longitude of celestial body as long as UTC datetime is passed in.
  return new Ephemeris(
    {
      year:utcDate.getUTCFullYear(),
      month: utcDate.getUTCMonth(),
      day: utcDate.getUTCDate(),
      hours: utcDate.getUTCHours(),
      minutes: utcDate.getUTCMinutes(),
      seconds: utcDate.getUTCSeconds(),
      key: bodyKey,
      calculateMotion: false
    }
  )[bodyKey].position.apparentLongitude
}

export const getApparentLongitudeDifference = (currentApparentLongitude, nextApparentLongitude) => {

  const nextMovementAmount = util.getModuloDifference(nextApparentLongitude, currentApparentLongitude, 360)

  return util.correctRealModuloNumber(nextMovementAmount, nextApparentLongitude, currentApparentLongitude, 360)
}

export const calculateNextRetrogradeStation = ({direction='next', bodyKey, utcDate, currentApparentLongitude=null}={}) => {
  if (!['next', 'prev'].includes(direction)) throw new Error(`Please pass in direction from the following: 'next' or 'prev'. Not "${direction}".`)

  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  let currentDate = util.cloneUTCDate(utcDate)

  let currentMovementAmount = getCurrentMovementAmount(bodyKey, utcDate, currentApparentLongitude)

  if (isRetrograde(currentMovementAmount)) {
    if (direction === 'next') {
      // Skip to end of current retrograde if movement indicates we're in one
      // and find the next retrograde moment from there
      const nextDirectMoment = calculateNextDirectMoment({direction: 'next', bodyKey, utcDate: currentDate, currentApparentLongitude})

      return calculateNextRetrogradeMoment({direction: 'next', bodyKey, utcDate: nextDirectMoment.date, currentApparentLongitude: nextDirectMoment.apparentLongitude})

    } else if (direction === 'prev') {
      // Skip backwards through entire retrograde to find next direct moment
      const prevDirectMoment = calculateNextDirectMoment({direction: 'prev', bodyKey, utcDate: currentDate, currentApparentLongitude})

      return calculateNextRetrogradeMoment({direction: 'next', bodyKey, utcDate: prevDirectMoment.date, currentApparentLongitude: prevDirectMoment.apparentLongitude})
    }
  } else {
    if (direction === 'next') {
      // If we're direct, just find the next retrograde moment
      return calculateNextRetrogradeMoment({direction: 'next', bodyKey, utcDate, currentApparentLongitude})
    } else if (direction === 'prev') {
      // Find prev retrograde moment
      const prevRetroMoment = calculateNextRetrogradeMoment({direction: 'prev', bodyKey, utcDate: currentDate, currentApparentLongitude})

      // Skip backwards through entire retrograde cycle to find next direct moment
      const prevDirectMoment = calculateNextDirectMoment({direction: 'prev', bodyKey, utcDate: prevRetroMoment.date, currentApparentLongitude: prevRetroMoment.apparentLongitude})

      // Find the first retrograde moment from the other side
      return calculateNextRetrogradeMoment({direction: 'next', bodyKey, utcDate: prevDirectMoment.date, currentApparentLongitude: prevDirectMoment.apparentLongitude})
    }
  }
}

export const calculateNextDirectStation = ({direction='next', bodyKey, utcDate, currentApparentLongitude=null}={}) => {
  if (!['next', 'prev'].includes(direction)) throw new Error(`Please pass in direction from the following: 'next' or 'prev'. Not "${direction}".`)


  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  let currentDate = util.cloneUTCDate(utcDate)

  let currentMovementAmount = getCurrentMovementAmount(bodyKey, utcDate, currentApparentLongitude)


  if (isDirect(currentMovementAmount)) {
    if (direction === 'next') {
      // Skip to end of current retrograde if movement indicates we're in one
      // and find the next retrograde moment from there
      const nextDirectMoment = calculateNextRetrogradeMoment({direction: 'next', bodyKey, utcDate: currentDate, currentApparentLongitude})

      return calculateNextDirectMoment({direction: 'next', bodyKey, utcDate: nextDirectMoment.date, currentApparentLongitude: nextDirectMoment.apparentLongitude})

    } else if (direction === 'prev') {
      // Skip backwards through entire retrograde to find next direct moment
      const prevDirectMoment = calculateNextRetrogradeMoment({direction: 'prev', bodyKey, utcDate: currentDate, currentApparentLongitude})

      return calculateNextDirectMoment({direction: 'next', bodyKey, utcDate: prevDirectMoment.date, currentApparentLongitude: prevDirectMoment.apparentLongitude})
    }
  } else {
    if (direction === 'next') {
      return calculateNextDirectMoment({direction: 'next', bodyKey, utcDate, currentApparentLongitude})
    } else if (direction === 'prev') {
      // Find prev direct moment
      const prevRetroMoment = calculateNextDirectMoment({direction: 'prev', bodyKey, utcDate: currentDate, currentApparentLongitude})

      // Skip backwards through entire direct to find next retrograde moment
      const prevDirectMoment = calculateNextRetrogradeMoment({direction: 'prev', bodyKey, utcDate: prevRetroMoment.date, currentApparentLongitude: prevRetroMoment.apparentLongitude})

      // Find the first direct moment from the other side
      return calculateNextDirectMoment({direction: 'next', bodyKey, utcDate: prevDirectMoment.date, currentApparentLongitude: prevDirectMoment.apparentLongitude})
    }
  }
}

export const calculateNextRetrogradeMoment = ({bodyKey, utcDate, currentApparentLongitude=null, direction='next'}={}) => {
  if (!['next', 'prev'].includes(direction)) throw new Error(`Please pass in direction from the following: 'next' or 'prev'. Not "${direction}".`)

  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  let currentDate = util.cloneUTCDate(utcDate)

  let currentMovementAmount = getCurrentMovementAmount(bodyKey, utcDate, currentApparentLongitude)

  if (isRetrograde(currentMovementAmount)) return motionEventObject({utcDate: currentDate, apparentLongitude: currentApparentLongitude, nextMovementAmount: currentMovementAmount, interval: 'second'})

  let intervalUnit
  let fixedDate
  let lastDate = currentDate
  let lastAppLong = currentApparentLongitude
  let lastMovementAmount = currentMovementAmount
  while(isDirect(currentMovementAmount)) {
    const tuningDirection = direction
    intervalUnit = 'date'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    // reset date hours
    currentDate = util.cloneUTCDate(currentDate)
    currentDate.setUTCHours(0)
    currentDate.setUTCMinutes(0)
    currentDate.setUTCSeconds(0)

    // Shifts by 1 day until retrograde date is found
    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  // NOTE - standardizes the approach to always approach from the past.
  // This is because I've found that calculating the next event can produce varied results when calculating from either the or the past.
  // For example, approaching a retrograde event from the past will find the event at 0:01, and approaching from the future another will find it at 0:50.
  // This seems to be more of an inconsistency or unexpected anomoly in the apparentLongitude calcs than anything else.
  fixedDate = util.cloneUTCDate(lastDate)
  fixedDate = getDirectedDate({direction: 'prev', unit: intervalUnit, utcDate: fixedDate})
  currentDate = fixedDate
  currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
  currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

  while(direction === 'next' ? isDirect(currentMovementAmount) : isRetrograde(currentMovementAmount)) {
    // Shifts by 1 hour until the first direct hour is found
    const tuningDirection = 'next'
    intervalUnit = 'hour'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    // reset date minutes
    currentDate = util.cloneUTCDate(currentDate)
    currentDate.setUTCMinutes(0)
    currentDate.setUTCSeconds(0)

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  fixedDate = util.cloneUTCDate(lastDate)
  fixedDate = getDirectedDate({direction: 'prev', unit: intervalUnit, utcDate: fixedDate})
  currentDate = fixedDate
  currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
  currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

  while(direction === 'next' ? isDirect(currentMovementAmount) : isRetrograde(currentMovementAmount)) {
    // Shifts by 1 minute until the first direct minute is found
    const tuningDirection = 'next'
    intervalUnit = 'minute'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    // reset date seconds
    currentDate = util.cloneUTCDate(currentDate)
    currentDate.setUTCSeconds(0)

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  fixedDate = util.cloneUTCDate(lastDate)
  fixedDate = getDirectedDate({direction: 'prev', unit: intervalUnit, utcDate: fixedDate})
  currentDate = fixedDate
  currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
  currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

  while(direction === 'next' ? isDirect(currentMovementAmount) : isRetrograde(lastMovementAmount)) {
    // Shifts by 1 second until the first retrograde second is found
    const tuningDirection = 'next'
    intervalUnit = 'second'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

    if (direction === 'next' && isRetrograde(currentMovementAmount)) {
      return motionEventObject({utcDate: currentDate, apparentLongitude: currentApparentLongitude, nextMovementAmount: currentMovementAmount, interval: intervalUnit})
    } else if (direction === 'prev' && isDirect(currentMovementAmount)) {
      return motionEventObject({utcDate: lastDate, apparentLongitude: lastAppLong, nextMovementAmount: lastMovementAmount, interval: intervalUnit})
    }
  }
}


export const calculateNextDirectMoment = ({bodyKey, utcDate, currentApparentLongitude=null, direction='next'}={}) => {
  if (!['next', 'prev'].includes(direction)) throw new Error(`Please pass in direction from the following: 'next' or 'prev'. Not "${direction}".`)

  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  let currentDate = util.cloneUTCDate(utcDate)

  let currentMovementAmount = getCurrentMovementAmount(bodyKey, utcDate, currentApparentLongitude)

  if (isDirect(currentMovementAmount)) return motionEventObject({utcDate, apparentLongitude: currentApparentLongitude, nextMovementAmount: currentMovementAmount, interval: 'second'})

  let intervalUnit
  let fixedDate
  let lastDate = currentDate
  let lastAppLong = currentApparentLongitude
  let lastMovementAmount = currentMovementAmount

  while(isRetrograde(currentMovementAmount)) {
    const tuningDirection = direction
    intervalUnit = 'date'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    // reset date hours
    currentDate = util.cloneUTCDate(currentDate)
    currentDate.setUTCHours(0)
    currentDate.setUTCMinutes(0)
    currentDate.setUTCSeconds(0)
    // Shifts by 1 day until retrograde date is found
    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  // NOTE - standardizes the approach to always approach from the past.
  // This is because I've found that calculating the next event can produce varied results when calculating from either the or the past.
  // For example, approaching a retrograde event from the past will find the event at 0:01, and approaching from the future another will find it at 0:50.
  // This seems to be more of an inconsistency or unexpected anomoly in the apparentLongitude calcs than anything else.
  fixedDate = util.cloneUTCDate(lastDate)
  fixedDate = getDirectedDate({direction: 'prev', unit: intervalUnit, utcDate: fixedDate})
  currentDate = fixedDate
  currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
  currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

  while(direction === 'next' ? isRetrograde(currentMovementAmount) : isDirect(currentMovementAmount)) {
    // Shifts by 1 hour until the first direct hour is found
    const tuningDirection = 'next'
    intervalUnit = 'hour'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    // reset date minutes
    currentDate = util.cloneUTCDate(currentDate)
    currentDate.setUTCMinutes(0)
    currentDate.setUTCSeconds(0)

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  fixedDate = util.cloneUTCDate(lastDate)
  fixedDate = getDirectedDate({direction: 'prev', unit: intervalUnit, utcDate: fixedDate})
  currentDate = fixedDate
  currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
  currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

  while(direction === 'next' ? isRetrograde(currentMovementAmount) : isDirect(currentMovementAmount)) {
    // Shifts by 1 minute until the first direct minute is found
    const tuningDirection = 'next'
    intervalUnit = 'minute'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    // reset date seconds
    currentDate = util.cloneUTCDate(currentDate)
    currentDate.setUTCSeconds(0)

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  fixedDate = util.cloneUTCDate(lastDate)
  fixedDate = getDirectedDate({direction: 'prev', unit: intervalUnit, utcDate: fixedDate})
  currentDate = fixedDate
  currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
  currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

  while(direction === 'next' ? isRetrograde(currentMovementAmount) : isDirect(lastMovementAmount)) {
    // Shifts by 1 second until the first retrograde second is found
    const tuningDirection = 'next'
    intervalUnit = 'second'

    lastDate = util.cloneUTCDate(currentDate)
    lastAppLong = currentApparentLongitude
    lastMovementAmount = currentMovementAmount

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)

    if (direction === 'next' && isDirect(currentMovementAmount)) {
      return motionEventObject({utcDate: currentDate, apparentLongitude: currentApparentLongitude, nextMovementAmount: currentMovementAmount, interval: intervalUnit})
    } else if (direction === 'prev' && isRetrograde(currentMovementAmount)) {
      return motionEventObject({utcDate: lastDate, apparentLongitude: lastAppLong, nextMovementAmount: lastMovementAmount, interval: intervalUnit})
    }
  }
}
