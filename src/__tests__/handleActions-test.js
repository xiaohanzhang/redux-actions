import { expect } from 'chai';
import { handleActions, createAction, createActions, combineActions } from '../';

describe('handleActions', () => {
  const defaultState = { counter: 0 };

  it('should throw an error when defaultState is not defined', () => {
    expect(() => {
      handleActions({
        INCREMENT: ({ counter }, { payload: amount }) => ({
          counter: counter + amount
        }),

        DECREMENT: ({ counter }, { payload: amount }) => ({
          counter: counter - amount
        })
      });
    }).to.throw(
      Error,
      'defaultState for reducer handling INCREMENT should be defined'
    );
  });

  it('should throw an error when defaultState is not defined for combinedActions', () => {
    expect(() => {
      handleActions({
        [
          combineActions(
            'INCREMENT',
            'DECREMENT'
          )
        ]: ({ counter }, { type, payload: amount }) => ({
          counter: counter + (type === 'INCREMENT' ? +1 : -1) * amount
        })
      });
    }).to.throw(
      Error,
      'defaultState for reducer handling INCREMENT, DECREMENT should be defined'
    );
  });

  it('create a single handler from a map of multiple action handlers', () => {
    const reducer = handleActions({
      INCREMENT: ({ counter }, { payload: amount }) => ({
        counter: counter + amount
      }),

      DECREMENT: ({ counter }, { payload: amount }) => ({
        counter: counter - amount
      })
    }, defaultState);

    expect(reducer({ counter: 3 }, { type: 'INCREMENT', payload: 7 }))
      .to.deep.equal({
        counter: 10
      });
    expect(reducer({ counter: 10 }, { type: 'DECREMENT', payload: 7 }))
      .to.deep.equal({
        counter: 3
      });
  });

  it('works with symbol action types', () => {
    const INCREMENT = Symbol();

    const reducer = handleActions({
      [INCREMENT]: ({ counter }, { payload: amount }) => ({
        counter: counter + amount
      })
    }, defaultState);

    expect(reducer({ counter: 3 }, { type: INCREMENT, payload: 7 }))
      .to.deep.equal({
        counter: 10
      });
  });

  it('accepts a default state used when previous state is undefined', () => {
    const reducer = handleActions({
      INCREMENT: ({ counter }, { payload: amount }) => ({
        counter: counter + amount
      }),

      DECREMENT: ({ counter }, { payload: amount }) => ({
        counter: counter - amount
      })
    }, { counter: 3 });

    expect(reducer(undefined, { type: 'INCREMENT', payload: 7 }))
      .to.deep.equal({
        counter: 10
      });
  });

  it('accepts action function as action type', () => {
    const incrementAction = createAction('INCREMENT');
    const reducer = handleActions({
      [incrementAction]: ({ counter }, { payload: amount }) => ({
        counter: counter + amount
      })
    }, defaultState);

    expect(reducer({ counter: 3 }, incrementAction(7)))
      .to.deep.equal({
        counter: 10
      });
  });

  it('should accept combined actions as action types in single reducer form', () => {
    const { increment, decrement } = createActions({
      INCREMENT: amount => ({ amount }),
      DECREMENT: amount => ({ amount: -amount })
    });

    const initialState = { counter: 10 };

    const reducer = handleActions({
      [combineActions(increment, decrement)](state, { payload: { amount } }) {
        return { ...state, counter: state.counter + amount };
      }
    }, defaultState);

    expect(reducer(initialState, increment(5))).to.deep.equal({ counter: 15 });
    expect(reducer(initialState, decrement(5))).to.deep.equal({ counter: 5 });
    expect(reducer(initialState, { type: 'NOT_TYPE', payload: 1000 })).to.equal(initialState);
    expect(reducer(undefined, increment(5))).to.deep.equal({ counter: 5 });
  });

  it('should accept combined actions as action types in the next/throw form', () => {
    const { increment, decrement } = createActions({
      INCREMENT: amount => ({ amount }),
      DECREMENT: amount => ({ amount: -amount })
    });

    const initialState = { counter: 10 };

    const reducer = handleActions({
      [combineActions(increment, decrement)]: {
        next(state, { payload: { amount } }) {
          return { ...state, counter: state.counter + amount };
        },

        throw(state) {
          return { ...state, counter: 0 };
        }
      }
    }, defaultState);
    const error = new Error;

    // non-errors
    expect(reducer(initialState, increment(5))).to.deep.equal({ counter: 15 });
    expect(reducer(initialState, decrement(5))).to.deep.equal({ counter: 5 });
    expect(reducer(initialState, { type: 'NOT_TYPE', payload: 1000 })).to.equal(initialState);
    expect(reducer(undefined, increment(5))).to.deep.equal({ counter: 5 });

    // errors
    expect(
      reducer(initialState, { type: 'INCREMENT', payload: error, error: true })
    ).to.deep.equal({ counter: 0 });
    expect(
      reducer(initialState, decrement(error))
    ).to.deep.equal({ counter: 0 });
  });

  it('should work with createActions action creators', () => {
    const { increment, decrement } = createActions('INCREMENT', 'DECREMENT');

    const reducer = handleActions({
      [increment]: ({ counter }, { payload }) => ({
        counter: counter + payload
      }),

      [decrement]: ({ counter }, { payload }) => ({
        counter: counter - payload
      })
    }, defaultState);

    expect(reducer({ counter: 3 }, increment(2)))
      .to.deep.equal({
        counter: 5
      });
    expect(reducer({ counter: 10 }, decrement(3)))
      .to.deep.equal({
        counter: 7
      });
  });

  it('accepts additional arguments', () => {
    const incrementAction = createAction('INCREMENT');
    const reducer = handleActions({
      [incrementAction]: (
        { counter }, { payload: amount }, extraArg1, extraArg2
      ) => ({ counter: counter + amount + extraArg1 + extraArg2 })
    }, defaultState);

    const extraArg1 = 5;
    const extraArg2 = 1;
    expect(reducer({ counter: 3 }, incrementAction(7), extraArg1, extraArg2))
      .to.deep.equal({
        counter: 10 + extraArg1 + extraArg2
      });
  });
});
