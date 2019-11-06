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
  if (!['date', 'minute', 'second'].includes(unit)) throw new Error(`Please pass in unit from the following: 'date', 'minute', or 'second'. Not "${unit}".`)

  const newDate = util.cloneUTCDate(utcDate)
  const directionIncrement = direction === 'next' ? 1 : -1

  if (unit === 'date') {
    newDate.setUTCDate(utcDate.getUTCDate() + directionIncrement)
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

export const calculateNextRetrogradeStation = ({bodyKey, utcDate, currentApparentLongitude=null}={}) => {
  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  let currentDate = util.cloneUTCDate(utcDate)

  let currentMovementAmount = getCurrentMovementAmount(bodyKey, utcDate, currentApparentLongitude)

  // Skip to end of current retrograde if movement indicates we're in one at start
  if (isRetrograde(currentMovementAmount)) {
    const endOfCurrentRetrograde = calculateNextDirectStation({bodyKey, utcDate: currentDate, currentApparentLongitude})
    currentDate = endOfCurrentRetrograde.date,
    currentApparentLongitude = endOfCurrentRetrograde.apparentLongitude
    currentMovementAmount = endOfCurrentRetrograde.nextMovementAmount
  }

  while(isDirect(currentMovementAmount)) {
    // console.log("current: ", currentDate, currentMovementAmount)
    const nextDate = getDirectedDate({direction:"next", unit: "date", utcDate:currentDate})
    const tomorrowApparentLongitude = new Ephemeris({
                      year: nextDate.getUTCFullYear(),
                      month: nextDate.getUTCMonth(),
                      day: nextDate.getUTCDate(),
                      hours: nextDate.getUTCHours(),
                      minutes: nextDate.getUTCMinutes(),
                      seconds: nextDate.getUTCSeconds(),
                      key: bodyKey,
                      calculateMotion: false,
                    })[bodyKey].position.apparentLongitude

    const nextCurrentMovementAmount = getApparentLongitudeDifference(currentApparentLongitude, tomorrowApparentLongitude)


    if (isRetrograde(nextCurrentMovementAmount)) {
      // Rewind by 1 day and find the exact minute it turns retro
      let prevDate = getDirectedDate({direction:"prev", unit: "date", utcDate:currentDate})
      let prevApparentLongitude = new Ephemeris({
                        year: prevDate.getUTCFullYear(),
                        month: prevDate.getUTCMonth(),
                        day: prevDate.getUTCDate(),
                        hours: prevDate.getUTCHours(),
                        minutes: prevDate.getUTCMinutes(),
                        seconds: prevDate.getUTCSeconds(),
                        key: bodyKey,
                        calculateMotion: false,
                      })[bodyKey].position.apparentLongitude

      let prevMovementAmount = getApparentLongitudeDifference(prevApparentLongitude, currentApparentLongitude)

      while (isDirect(prevMovementAmount)) {
        // console.log("current min: ", prevDate, prevMovementAmount)
        const nextMinute = getDirectedDate({direction: "next", unit: "minute", utcDate: prevDate})
        const nextMinuteApparentLongitude = new Ephemeris({
                          year: nextMinute.getUTCFullYear(),
                          month: nextMinute.getUTCMonth(),
                          day: nextMinute.getUTCDate(),
                          hours: nextMinute.getUTCHours(),
                          minutes: nextMinute.getUTCMinutes(),
                          seconds: nextMinute.getUTCSeconds(),
                          key: bodyKey,
                          calculateMotion: false,
                        })[bodyKey].position.apparentLongitude

        const nextCurrentMovementAmount = getApparentLongitudeDifference(prevApparentLongitude, nextMinuteApparentLongitude)

        if (isRetrograde(nextCurrentMovementAmount)) {
          console.log('BREAK!', prevDate)
          return {
            date: prevDate,
            apparentLongitude: prevApparentLongitude,
            nextMovementAmount: nextCurrentMovementAmount
          }
        } else {
          prevDate = nextMinute
          prevApparentLongitude = nextMinuteApparentLongitude,
          prevMovementAmount = nextCurrentMovementAmount
        }
      }
    } else {
      currentDate = nextDate
      currentApparentLongitude = tomorrowApparentLongitude
      currentMovementAmount = nextCurrentMovementAmount
    }

  }
}

export const calculateNextDirectStation = ({bodyKey, utcDate, currentApparentLongitude=null}={}) => {
  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  let currentDate = util.cloneUTCDate(utcDate)

  let currentMovementAmount = getCurrentMovementAmount(bodyKey, utcDate, currentApparentLongitude)


  // Skip to end of current direct if movement indicates we're in one at start
  if (isDirect(currentMovementAmount)) {
    const endOfCurrentDirect = calculateNextRetrogradeStation({bodyKey, utcDate: currentDate, currentApparentLongitude})
    currentDate = endOfCurrentDirect.date,
    currentApparentLongitude = endOfCurrentDirect.apparentLongitude
    currentMovementAmount = endOfCurrentDirect.nextMovementAmount
  }

  // console.log("initial: ", currentDate, currentMovementAmount)
  while(isRetrograde(currentMovementAmount)) {
    // console.log("current: ", currentDate, currentMovementAmount)
    const nextDate = getDirectedDate({direction:"next", unit: "date", utcDate:currentDate})
    const tomorrowApparentLongitude = new Ephemeris({
                      year: nextDate.getUTCFullYear(),
                      month: nextDate.getUTCMonth(),
                      day: nextDate.getUTCDate(),
                      hours: nextDate.getUTCHours(),
                      minutes: nextDate.getUTCMinutes(),
                      seconds: nextDate.getUTCSeconds(),
                      key: bodyKey,
                      calculateMotion: false,
                    })[bodyKey].position.apparentLongitude

    const nextCurrentMovementAmount = getApparentLongitudeDifference(currentApparentLongitude, tomorrowApparentLongitude)


    if (isDirect(nextCurrentMovementAmount)) {
      // Rewind by 1 day and find the exact minute it turns direct
      let prevDate = getDirectedDate({direction:"prev", unit: "date", utcDate:currentDate})
      let prevApparentLongitude = new Ephemeris({
                        year: prevDate.getUTCFullYear(),
                        month: prevDate.getUTCMonth(),
                        day: prevDate.getUTCDate(),
                        hours: prevDate.getUTCHours(),
                        minutes: prevDate.getUTCMinutes(),
                        seconds: prevDate.getUTCSeconds(),
                        key: bodyKey,
                        calculateMotion: false,
                      })[bodyKey].position.apparentLongitude

      let prevMovementAmount = getApparentLongitudeDifference(prevApparentLongitude, currentApparentLongitude)

      while (isRetrograde(prevMovementAmount)) {
        // console.log("current min: ", prevDate, prevMovementAmount)
        const nextMinute = getDirectedDate({direction: "next", unit: "minute", utcDate: prevDate})
        const nextMinuteApparentLongitude = new Ephemeris({
                          year: nextMinute.getUTCFullYear(),
                          month: nextMinute.getUTCMonth(),
                          day: nextMinute.getUTCDate(),
                          hours: nextMinute.getUTCHours(),
                          minutes: nextMinute.getUTCMinutes(),
                          seconds: nextMinute.getUTCSeconds(),
                          key: bodyKey,
                          calculateMotion: false,
                        })[bodyKey].position.apparentLongitude

        const nextCurrentMovementAmount = getApparentLongitudeDifference(prevApparentLongitude, nextMinuteApparentLongitude)

        if (isDirect(nextCurrentMovementAmount)) {
          // console.log('BREAK!', prevDate)
          return {
            date: prevDate,
            apparentLongitude: prevApparentLongitude,
            nextMovementAmount: nextCurrentMovementAmount
          }
        } else {
          prevDate = nextMinute
          prevApparentLongitude = nextMinuteApparentLongitude,
          prevMovementAmount = nextCurrentMovementAmount
        }
      }
    } else {
      currentDate = nextDate
      currentApparentLongitude = tomorrowApparentLongitude
      currentMovementAmount = nextCurrentMovementAmount
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
  while(isDirect(currentMovementAmount)) {
    // Shifts by 1 day until retrograde date is found
    const tuningDirection = direction
    intervalUnit = 'date'
    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  let lastDate, lastApparentLongitude, lastMovementAmount
  while(isRetrograde(currentMovementAmount)) {
    // Shifts by 1 minute until the last retrograde minute is found
    // Backwards if looking for next, forwards if looking for prev
    const tuningDirection = direction === 'next' ? 'prev' : 'next'
    intervalUnit = 'minute'

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  while(isDirect(currentMovementAmount)) {
    // Shifts by 1 second until the last retrograde minute is found
    const tuningDirection = direction
    intervalUnit = 'second'

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  return motionEventObject({utcDate: currentDate, apparentLongitude: currentApparentLongitude, nextMovementAmount: currentMovementAmount, interval: intervalUnit})
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
  while(isRetrograde(currentMovementAmount)) {
    const tuningDirection = direction
    intervalUnit = 'date'

    // Shifts by 1 day until retrograde date is found
    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  while(isDirect(currentMovementAmount)) {
    // Shifts by 1 minute until the last retrograde minute is found
    const tuningDirection = direction === 'next' ? 'prev' : 'next'
    intervalUnit = 'minute'

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  while(isRetrograde(currentMovementAmount)) {
    // Shifts by 1 second until the last retrograde second is found
    const tuningDirection = direction
    intervalUnit = 'second'

    currentDate = getDirectedDate({direction: tuningDirection, unit: intervalUnit, utcDate: currentDate})
    currentApparentLongitude = getApparentLongitude(bodyKey, currentDate)
    currentMovementAmount = getCurrentMovementAmount(bodyKey, currentDate, currentApparentLongitude)
  }

  return motionEventObject({utcDate: currentDate, apparentLongitude: currentApparentLongitude, nextMovementAmount: currentMovementAmount, interval: intervalUnit})

}
