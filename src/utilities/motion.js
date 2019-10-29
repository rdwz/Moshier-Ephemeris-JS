import Ephemeris from '../Ephemeris'
import { util } from '../utilities/util'

export const getDirectedDate = ({direction = 'next', unit = 'date', utcDate}={}) => {
  // Given a date object, returns next [date or minute] or prev [date or minute] in new date object
  if (!['next', 'prev'].includes(direction)) throw new Error(`Please pass in direction from the following: 'next' or 'prev'. Not "${direction}".`)
  if (!['date', 'minute'].includes(unit)) throw new Error(`Please pass in unit from the following: 'date' or 'minute'. Not "${unit}".`)

  const newDate = new Date(utcDate)
  const directionIncrement = direction === 'next' ? 1 : -1

  if (unit === 'date') {
    newDate.setUTCDate(utcDate.getUTCDate() + directionIncrement)
  } else if (unit === 'minute') {
    newDate.setUTCMinutes(utcDate.getUTCMinutes() + directionIncrement)
  }

  return newDate
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

export const getApparentLongitudeDifference = (currentApparentLongitude, nextMinuteApparentLongitude) => {

  const nextMinuteDifference = util.getModuloDifference(nextMinuteApparentLongitude, currentApparentLongitude, 360)

  return util.correctRealModuloNumber(nextMinuteDifference, nextMinuteApparentLongitude, currentApparentLongitude, 360)
}

export const calculateNextRetrogradeStation = ({bodyKey, utcDate, currentApparentLongitude=null}={}) => {
  if (!currentApparentLongitude) {
    currentApparentLongitude = getApparentLongitude(bodyKey, utcDate)
  }

  let currentDate = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes()))

  let currentMovementAmount = getApparentLongitudeDifference(currentApparentLongitude, getApparentLongitude(bodyKey, getDirectedDate({direction: "next", unit: "minute", utcDate})))

  // Skip to end of current retrograde if movement indicates we're in one at start
  if (currentMovementAmount <= 0 ) {
    const endOfCurrentRetrograde = calculateNextDirectStation({bodyKey, utcDate: currentDate, currentApparentLongitude})
    currentDate = endOfCurrentRetrograde.date,
    currentApparentLongitude = endOfCurrentRetrograde.apparentLongitude
    currentMovementAmount = endOfCurrentRetrograde.nextMinuteDifference
  }

  while(currentMovementAmount > 0) {
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


    if (nextCurrentMovementAmount <= 0 ) {
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

      while (prevMovementAmount > 0) {
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

        if (nextCurrentMovementAmount <= 0) {
          console.log('BREAK!', prevDate)
          return {
            date: prevDate,
            apparentLongitude: prevApparentLongitude,
            nextMinuteDifference: nextCurrentMovementAmount
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

  let currentDate = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes()))

  let currentMovementAmount = getApparentLongitudeDifference(currentApparentLongitude, getApparentLongitude(bodyKey, getDirectedDate({direction: "next", unit: "minute", utcDate})))
  // Skip to end of current direct if movement indicates we're in one at start
  if (currentMovementAmount >= 0 ) {
    const endOfCurrentDirect = calculateNextRetrogradeStation({bodyKey, utcDate: currentDate, currentApparentLongitude})
    currentDate = endOfCurrentDirect.date,
    currentApparentLongitude = endOfCurrentDirect.apparentLongitude
    currentMovementAmount = endOfCurrentDirect.nextMinuteDifference
  }

  console.log("initial: ", currentDate, currentMovementAmount)
  while(currentMovementAmount < 0) {
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


    if (nextCurrentMovementAmount >= 0 ) {
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

      while (prevMovementAmount < 0) {
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

        if (nextCurrentMovementAmount >= 0) {
          console.log('BREAK!', prevDate)
          return {
            date: prevDate,
            apparentLongitude: prevApparentLongitude,
            nextMinuteDifference: nextCurrentMovementAmount
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
