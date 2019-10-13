import Luna from '../../src/classes/Luna'

describe('Luna', () => {
  describe('GetWithinQuarterApproximation', () => {
    it('returns boolean if phase is within approximation', () => {

      expect(Luna.GetWithinQuarterApproximation({phaseDaysBefore: 1, phaseDaysPast: 0, halfRangeLength: 1.5 })).toBe(true)

      expect(Luna.GetWithinQuarterApproximation({phaseDaysBefore: undefined, phaseDaysPast: 1, halfRangeLength: 1.5 })).toBe(true)

      expect(Luna.GetWithinQuarterApproximation({phaseDaysBefore: 2, phaseDaysPast: 0, halfRangeLength: 1.5 })).toBe(false)

      expect(Luna.GetWithinQuarterApproximation({phaseDaysBefore: undefined, phaseDaysPast: 2, halfRangeLength: 1.5 })).toBe(false)

      expect(Luna.GetWithinQuarterApproximation({phaseDaysBefore: undefined, phaseDaysPast: undefined, halfRangeLength: 1.5 })).toBe(false)
    })
  })

  describe('GetQuarterApproximationString', () => {
    it('returns boolean if phase is within approximation', () => {

      expect(Luna.GetQuarterApproximationString({quarterIndex: 0, phaseDaysBefore: 2, phaseDaysPast: undefined, halfRangeLength: 1.5 })).toBe(undefined)

      expect(Luna.GetQuarterApproximationString({quarterIndex: 0, phaseDaysBefore: undefined, phaseDaysPast: 2, halfRangeLength: 1.5 })).toBe(undefined)

      expect(Luna.GetQuarterApproximationString({quarterIndex: 0, phaseDaysBefore: undefined, phaseDaysPast: undefined, halfRangeLength: 1.5 })).toBe(undefined)

      expect(Luna.GetQuarterApproximationString({quarterIndex: 0, phaseDaysBefore: 1, phaseDaysPast: 0, halfRangeLength: 1.5 })).toBe("Entering First Quarter")

      expect(Luna.GetQuarterApproximationString({quarterIndex: 1, phaseDaysBefore: undefined, phaseDaysPast: 1, halfRangeLength: 1.5 })).toBe("Leaving First Quarter")

      expect(Luna.GetQuarterApproximationString({quarterIndex: 1, phaseDaysBefore: 1, phaseDaysPast: 0, halfRangeLength: 1.5 })).toBe("Entering Full Moon")

      expect(Luna.GetQuarterApproximationString({quarterIndex: 2, phaseDaysBefore: undefined, phaseDaysPast: 1, halfRangeLength: 1.5 })).toBe("Leaving Full Moon")

      expect(Luna.GetQuarterApproximationString({quarterIndex: 2, phaseDaysBefore: 1, phaseDaysPast: 0, halfRangeLength: 1.5 })).toBe("Entering Last Quarter")

      expect(Luna.GetQuarterApproximationString({quarterIndex: 3, phaseDaysBefore: undefined, phaseDaysPast: 1, halfRangeLength: 1.5 })).toBe("Leaving Last Quarter")

      expect(Luna.GetQuarterApproximationString({quarterIndex: 3, phaseDaysBefore: 1, phaseDaysPast: 0, halfRangeLength: 1.5 })).toBe("Entering New Moon")

      expect(Luna.GetQuarterApproximationString({quarterIndex: 0, phaseDaysBefore: undefined, phaseDaysPast: 1, halfRangeLength: 1.5 })).toBe("Leaving New Moon")

    })
  })

  describe('GetShapeString', () => {
    it ('returns the correct string', () => {
      expect(Luna.GetShapeString({illuminatedFraction: 0 })).toBe('Crescent')
      expect(Luna.GetShapeString({illuminatedFraction: 0.49 })).toBe('Crescent')
      expect(Luna.GetShapeString({illuminatedFraction: 0.5 })).toBe('Gibbous')
      expect(Luna.GetShapeString({illuminatedFraction: 0.99 })).toBe('Gibbous')
    })
  })

  describe('GetShapeDirectionString', () => {
    it ('returns the correct string', () => {
      expect(Luna.GetShapeDirectionString({phaseDecimal: 0 })).toBe('Waxing')
      expect(Luna.GetShapeDirectionString({phaseDecimal: 0.49 })).toBe('Waxing')
      expect(Luna.GetShapeDirectionString({phaseDecimal: 0.5 })).toBe('Waning')
      expect(Luna.GetShapeDirectionString({phaseDecimal: 0.99 })).toBe('Waning')
    })
  })
})
