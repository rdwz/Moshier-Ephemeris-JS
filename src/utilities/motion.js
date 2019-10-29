import Ephemeris from '../Ephemeris'
import { util } from '../utilities/util'

export const getNextMinute = utcDate => {
  const nextMinute = new Date(utcDate)
  nextMinute.setUTCMinutes(utcDate.getUTCMinutes() + 1)
  return nextMinute
}

export const getNextDate = utcDate => {
  const nextDate = new Date(utcDate)
  nextDate.setUTCDate(utcDate.getUTCDate() + 1)
  return nextDate
}

export const getPrevDate = utcDate => {
  const prevDate = new Date(utcDate)
  prevDate.setUTCDate(utcDate.getUTCDate() - 1)
  return prevDate
}

export const getNextApparentLongitude = (bodyKey, nextUTCDate, observer) => {

  return new Ephemeris(
    {
      year:nextUTCDate.getUTCFullYear(),
      month: nextUTCDate.getUTCMonth(),
      day: nextUTCDate.getUTCDate(),
      hours: nextUTCDate.getUTCHours(),
      minutes: nextUTCDate.getUTCMinutes(),
      seconds: nextUTCDate.getUTCSeconds(),
      latitude: observer.latitude,
      longitude: observer.longitude,
      height: observer.height,
      key: bodyKey,
      calculateMotion: false
    }
  )[bodyKey].position.apparentLongitude
}

export const getApparentLongitudeDifference = (currentApparentLongitude, nextMinuteApparentLongitude) => {

  const nextMinuteDifference = util.getModuloDifference(nextMinuteApparentLongitude, currentApparentLongitude, 360)

  return util.correctRealModuloNumber(nextMinuteDifference, nextMinuteApparentLongitude, currentApparentLongitude, 360)
}

export const calculateNextRetrogradeStation = ({bodyKey, utcDate, observer={}, currentApparentLongitude=null}={}) => {
  if (!currentApparentLongitude) {
    currentApparentLongitude = new Ephemeris({
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth(),
        day: utcDate.getUTCDate(),
        hours: utcDate.getUTCHours(),
        minutes: utcDate.getUTCMinutes(),
        seconds: utcDate.getUTCSeconds(),
        latitude: observer.latitude,
        longitude: observer.longitude,
        height: observer.height,
        key: bodyKey,
        calculateMotion: false
      })[bodyKey].position.apparentLongitude
  }

  let currentDate = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes()))

  let currentMovementAmount = getApparentLongitudeDifference(currentApparentLongitude, getNextApparentLongitude(bodyKey, getNextMinute(utcDate), observer))

  // Skip to end of current retrograde if movement indicates we're in one at start
  if (currentMovementAmount <= 0 ) {
    const endOfCurrentRetrograde = calculateNextDirectStation({bodyKey, utcDate: currentDate, observer, currentApparentLongitude})
    currentDate = endOfCurrentRetrograde.date,
    currentApparentLongitude = endOfCurrentRetrograde.apparentLongitude
    currentMovementAmount = endOfCurrentRetrograde.movement
  }

  while(currentMovementAmount > 0) {
    console.log("current: ", currentDate, currentMovementAmount)
    const nextDate = getNextDate(currentDate)
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
      let prevDate = getPrevDate(currentDate)
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
        console.log("current min: ", prevDate, prevMovementAmount)
        const nextMinute = getNextMinute(prevDate)
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
            movement: nextCurrentMovementAmount
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

export const calculateNextDirectStation = ({bodyKey, utcDate, observer={}, currentApparentLongitude=null}={}) => {
  if (!currentApparentLongitude) {
    currentApparentLongitude = new Ephemeris({
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth(),
        day: utcDate.getUTCDate(),
        hours: utcDate.getUTCHours(),
        minutes: utcDate.getUTCMinutes(),
        seconds: utcDate.getUTCSeconds(),
        latitude: observer.latitude,
        longitude: observer.longitude,
        height: observer.height,
        key: bodyKey,
        calculateMotion: false
      })[bodyKey].position.apparentLongitude
  }

  let currentDate = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes()))

  let currentMovementAmount = getApparentLongitudeDifference(currentApparentLongitude, getNextApparentLongitude(bodyKey, getNextMinute(utcDate), observer))
  // Skip to end of current direct if movement indicates we're in one at start
  if (currentMovementAmount >= 0 ) {
    const endOfCurrentDirect = calculateNextRetrogradeStation({bodyKey, utcDate: currentDate, observer, currentApparentLongitude})
    currentDate = endOfCurrentDirect.date,
    currentApparentLongitude = endOfCurrentDirect.apparentLongitude
    currentMovementAmount = endOfCurrentDirect.movement
  }

  console.log("initial: ", currentDate, currentMovementAmount)
  while(currentMovementAmount < 0) {
    console.log("current: ", currentDate, currentMovementAmount)
    const nextDate = getNextDate(currentDate)
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
      let prevDate = getPrevDate(currentDate)
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
        console.log("current min: ", prevDate, prevMovementAmount)
        const nextMinute = getNextMinute(prevDate)
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
            movement: nextCurrentMovementAmount
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
