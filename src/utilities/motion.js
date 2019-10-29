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

export const calculateNextRetrogradeDate = ({bodyKey, utcDate, observer={}, currentApparentLongitude=null}={}) => {
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

  let currentMovementAmount = getApparentLongitudeDifference(currentApparentLongitude, getNextApparentLongitude(bodyKey, getNextDate(utcDate), observer))

  console.log("initial: ", currentDate, currentMovementAmount)
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


    if (nextCurrentMovementAmount < 0 ) {
      console.log("RETRO DATE: ", currentDate)
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

        if (nextCurrentMovementAmount < 0) {
          console.log('BREAK!', prevDate)
          return prevDate
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
