import {getDirectedDate, calculateNextRetrogradeStation, calculateNextDirectStation } from '../../src/utilities/motion'

describe('getDirectedDate', () => {
  const utcDate = new Date(Date.UTC(2019, 9, 31, 0, 0)) // 10/31/2019 midnight UTC
  describe('errors', () => {
    it('throws invalid direction error', () => {
      expect(() => getDirectedDate({direction: 'bad direction', unit: 'date', utcDate})).toThrowError("Please pass in direction from the following: 'next' or 'prev'. Not \"bad direction\".")
    })

    it('throws invalid unit error', () => {
      expect(() => getDirectedDate({direction: 'next', unit: 'bad unit', utcDate})).toThrowError("Please pass in unit from the following: 'date' or 'minute'. Not \"bad unit\".")
    })
  })

  describe('next', () => {
    it('finds the next date', () => {
      const newDate = getDirectedDate({direction: 'next', unit: 'date', utcDate})
      expect(newDate).toEqual(new Date("2019-11-01T00:00:00.000Z")) // 11/1/2019 midnight UTC
    })

    it('finds the next minute', () => {
      const newDate = getDirectedDate({direction: 'next', unit: 'minute', utcDate})
      expect(newDate).toEqual(new Date("2019-10-31T00:01:00.000Z")) // 10/31/2019 00:01 UTC
    })
  })

  describe('prev', () => {
    it('finds the prev date', () => {
      const newDate = getDirectedDate({direction: 'prev', unit: 'date', utcDate})
      expect(newDate).toEqual(new Date("2019-10-30T00:00:00.000Z")) // 10/30/2019 midnight UTC
    })

    it('finds the prev minute', () => {
      const newDate = getDirectedDate({direction: 'prev', unit: 'minute', utcDate})
      expect(newDate).toEqual(new Date("2019-10-30T23:59:00.000Z")) // 10/30/2019 23:59 UTC
    })
  })
})

describe('calculateNextRetrogradeStation', () => {
  describe('in a direct datetime', () => {

    it('finds the next retrograde station', () => {
      const utcDate = new Date(Date.UTC(2019, 9, 31, 0, 0)) // direct 10/31/2019 midnight UTC
      const station = calculateNextRetrogradeStation({bodyKey: 'mercury', utcDate})

      expect(station.date).toEqual(new Date("2019-10-31T15:43:00.000Z")) // 10/31/2019 15:43 UTC
      expect(station.apparentLongitude).toEqual(237.6378590821993)
      expect(station.nextMinuteDifference).toEqual(-5.9122839957126416e-8)

    })
  })

  describe('in a retrograde datetime', () => {

    it('finds the next retrograde station', () => {
      const utcDate = new Date(Date.UTC(2019, 9, 31, 20, 0)) // retrograde 10/31/2019 20:00 UTC
      const station = calculateNextRetrogradeStation({bodyKey: 'mercury', utcDate})

      expect(station.date).toEqual(new Date("2020-02-17T00:55:00.000Z")) // 2/17/2020 00:55 UTC
      expect(station.apparentLongitude).toEqual(342.88971141933405)
      expect(station.nextMinuteDifference).toEqual(-2.8375666261126753e-8)

    })
  })
})

describe('calculateNextDirectStation', () => {
  describe('in a direct datetime', () => {
    it('finds the next direct station', () => {
      const utcDate = new Date(Date.UTC(2019, 9, 31, 0, 0)) // direct on 10/31/2019 midnight UTC
      const station = calculateNextDirectStation({bodyKey: 'mercury', utcDate})

      expect(station.date).toEqual(new Date("2019-11-20T19:13:00.000Z")) // 11/20/2019 19:13 UTC
      expect(station.apparentLongitude).toEqual(221.58646545546335)
      expect(station.nextMinuteDifference).toEqual(6.07640515681851e-8)

    })
  })

  describe('in a retrograde datetime', () => {
    it('finds the next direct station', () => {
      const utcDate = new Date(Date.UTC(2019, 9, 31, 20, 0)) // retrograde on 10/31/2019 20:00 UTC
      const station = calculateNextDirectStation({bodyKey: 'mercury', utcDate})

      expect(station.date).toEqual(new Date("2019-11-20T19:13:00.000Z")) // 11/20/2019 19:13 UTC
      expect(station.apparentLongitude).toEqual(221.58646545546335)
      expect(station.nextMinuteDifference).toEqual(6.07640515681851e-8)

    })
  })
})
