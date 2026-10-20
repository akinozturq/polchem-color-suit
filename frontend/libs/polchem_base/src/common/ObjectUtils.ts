import _ from 'lodash';

export function omitNullValues(obj: object): object {
  return _.omitBy(obj, _.isNull);
}

export function assertNotEmpty(obj: object, msg: string): void {
  console.assert(
    _.isEmpty(obj),
    (msg || 'Object not empty') + ' ' + JSON.stringify(obj)
  );
}

/** Test if value is a number (not NaN, infinity or any other type)  */
export function isNumber(value: unknown): value is number {
  return Number.isFinite(value);
}

/**
 * Group objects in an array and reduce each group
 * @param {array} arr Array of objects
 * @param {string} keyName Name of property to group by
 * @param {function} reducer f(acc, obj) to aggregate the grouped objects;
 *  acc is previous aggeregate or undefined, obj is an object in arr
 * @returns
 */
export function groupAndReduce<T>(
  arr: T[],
  keyName: keyof T,
  reducer: (acc: T | undefined, obj: T) => T
): T[] {
  const map = arr.reduce((acc, obj) => {
    const key = obj[keyName];
    acc.set(key, reducer(acc.get(key), obj));
    return acc;
  }, new Map<unknown, T>());

  return Array.from(map, ([key, row]) => {
    return {
      [keyName]: key,
      ...row,
    };
  });
}
