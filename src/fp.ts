export function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

// @__NO_SIDE_EFFECTS__
export function identityFn<X>(x: X): X {
  return x;
}

// ------------ Option type
export type Option<A> = { t: "none" } | { t: "some"; v: A };

// constructors
export const Option_none: Option<never> = { t: "none" };
export const Option_some = <A>(v: A): Option<A> => ({ t: "some", v });

// functions
export const Option_map = <A, B>(oa: Option<A>, f: (a: A) => B): Option<B> =>
  oa.t === "some" ? Option_some(f(oa.v)) : Option_none;
export const Option_bind = <A, B>(
  oa: Option<A>,
  f: (a: A) => Option<B>,
): Option<B> => (oa.t === "some" ? f(oa.v) : Option_none);
export const Option_getD = <A>(oa: Option<A>, d: A): A =>
  oa.t === "some" ? oa.v : d;
export const Option_ap = <A, B>(
  of: Option<(a: A) => B>,
  oa: Option<A>,
): Option<B> =>
  of.t === "some" && oa.t === "some" ? Option_some(of.v(oa.v)) : Option_none;

// checkers
export const Option_isSome = <A>(oa: Option<A>): oa is { t: "some"; v: A } =>
  oa.t === "some";
export const Option_isNone = <A>(oa: Option<A>): oa is { t: "none" } =>
  oa.t === "none";

// convert
export const Option_toUndefined = <A>(oa: Option<A>): A | undefined =>
  oa.t === "some" ? oa.v : undefined;
export const Option_fromNullable = <A>(a: A | null | undefined): Option<A> =>
  a == null ? Option_none : Option_some(a);

// ------------ Sum type
export type Sum<L, R> = { t: "l"; v: L } | { t: "r"; v: R };

// constructors
export const Sum_l = <L, R>(l: L): Sum<L, R> => ({ t: "l", v: l });
export const Sum_r = <L, R>(r: R): Sum<L, R> => ({ t: "r", v: r });

// functions
export const Sum_mapl = <L, L2, R>(
  sa: Sum<L, R>,
  f: (l: L) => L2,
): Sum<L2, R> => (sa.t === "l" ? Sum_l(f(sa.v)) : sa);
export const Sum_mapr = <L, R, R2>(
  sa: Sum<L, R>,
  f: (r: R) => R2,
): Sum<L, R2> => (sa.t === "r" ? Sum_r(f(sa.v)) : sa);

export const Sum_partition = <L, R>(xs: readonly Sum<L, R>[]): [L[], R[]] => {
  const ls: L[] = [];
  const rs: R[] = [];
  for (const x of xs) {
    if (x.t === "l") {
      ls.push(x.v);
    } else {
      rs.push(x.v);
    }
  }
  return [ls, rs];
};

// ------------ Except type
export type Except<E, A> = { t: "ok"; v: A } | { t: "error"; error: E };

// constructors
export const Except_ok = <E, A>(v: A): Except<E, A> => ({ t: "ok", v });
export const Except_error = <E, A = never>(err: E): Except<E, A> => ({
  t: "error",
  error: err,
});

// functions
export const Except_map = <E, A, B>(
  ea: Except<E, A>,
  f: (a: A) => B,
): Except<E, B> => (ea.t === "ok" ? Except_ok(f(ea.v)) : ea);
export const Except_mapError = <E, F, A>(
  ea: Except<E, A>,
  f: (e: E) => F,
): Except<F, A> => (ea.t === "error" ? Except_error(f(ea.error)) : ea);
export const Except_bind = <E, A, B>(
  ea: Except<E, A>,
  f: (a: A) => Except<E, B>,
): Except<E, B> => (ea.t === "ok" ? f(ea.v) : ea);
export const Except_getD = <E, A>(ea: Except<E, A>, d: A): A =>
  ea.t === "ok" ? ea.v : d;
export const Except_bimap = <E, F, A, B>(
  ea: Except<E, A>,
  fErr: (e: E) => F,
  fOk: (a: A) => B,
): Except<F, B> =>
  ea.t === "ok" ? Except_ok(fOk(ea.v)) : Except_error(fErr(ea.error));

export function Except_foldrM<E, A, B>(
  arr: readonly A[],
  initial: B,
  f: (acc: B, a: A) => Except<E, B>,
): Except<E, B> {
  let acc: B = initial;

  for (const a of arr) {
    const res = f(acc, a);
    if (res.t === "ok") {
      acc = res.v;
    } else {
      return Except_error(res.error); // fail-fast
    }
  }

  return Except_ok(acc);
}

export function Except_foldrM1<E, A>(
  [h, ...t]: readonly [A, ...A[]],
  f: (acc: A, a: A) => Except<E, A>,
): Except<E, A> {
  return Except_foldrM(t, h, f);
}

export const Except_toOption = <E, A>(ea: Except<E, A>): Option<A> =>
  ea.t === "ok" ? Option_some(ea.v) : Option_none;

export const Except_partition = <E, A>(
  eas: readonly Except<E, A>[],
): Except<[E, ...E[]], A[]> => {
  const values: A[] = [];
  const errors: E[] = [];

  for (const ea of eas) {
    if (ea.t === "ok") {
      values.push(ea.v);
    } else {
      errors.push(ea.error);
    }
  }

  return errors.length > 0
    ? Except_error(errors as [E, ...E[]])
    : Except_ok(values);
};

export const Except_isOk = <E, A>(ea: Except<E, A>): ea is { t: "ok"; v: A } =>
  ea.t === "ok";
export const Except_isError = <E, A>(
  ea: Except<E, A>,
): ea is { t: "error"; error: E } => ea.t === "error";

export function Except_unwrapOrThrowErrorOnParsingTypeError<A>(
  ea: Except<string | readonly string[], A>,
  entity: string,
  original: unknown,
): A {
  switch (ea.t) {
    case "ok":
      return ea.v;
    case "error": {
      const errs = Array.isArray(ea.error) ? ea.error.join(", ") : ea.error;
      console.error(original);
      throw new TypeError(`Value is not an ${entity}: ${errs}`);
    }
    default:
      return assertNever(ea);
  }
}

export function Except_makeArrayParser<T>(
  elementParser: (input: unknown) => Except<readonly string[], T>,
): (input: unknown) => Except<string[], T[]> {
  return (input: unknown): Except<string[], T[]> => {
    if (!Array.isArray(input))
      return Except_error([`Expected array, got ${typeof input}`]);

    const results: T[] = [];
    const errors = new Set<string>();

    input.forEach((item, index) => {
      const result = elementParser(item);
      if (Except_isOk(result)) {
        results.push(result.v);
      } else {
        for (const err of result.error) {
          errors.add(`Index ${index}: ${err}`);
        }
      }
    });

    return errors.size > 0 ? Except_error([...errors]) : Except_ok(results);
  };
}

export function Except_appTraverse<E, A, B>(
  arr: readonly A[],
  f: (a: A) => Except<E, B>,
): Except<E[], B[]> {
  const values: B[] = [];
  const errors: E[] = [];

  arr.forEach((a) => {
    const res = f(a);
    if (res.t === "ok") {
      values.push(res.v);
    } else {
      errors.push(res.error);
    }
  });

  return errors.length > 0 ? Except_error(errors) : Except_ok(values);
}

export function Except_appTraverseFast<E, A, B>(
  arr: readonly A[],
  f: (a: A) => Except<E, B>,
): Except<E, B[]> {
  const result: B[] = [];

  for (const a of arr) {
    const res = f(a);
    if (res.t === "ok") {
      result.push(res.v);
    } else {
      return Except_error(res.error); // fail-fast
    }
  }

  return Except_ok(result);
}

// TYPES
export type ValidNumber = number & {
  readonly __ValidNumberBrand: "ValidNumber";
};
export const validNumber__maxDigitsBeforeDot = 20 as number;
export const validNumber__maxDigitsAfterDot = 10 as number;

export function number_isValidNumber(num: number): num is ValidNumber {
  if (!Number.isFinite(num)) return false;
  return true;
}

export function number_throwIfNotValidNumber(
  num: number,
): asserts num is ValidNumber {
  if (!number_isValidNumber(num))
    throw new TypeError(
      `Invalid number: must have ≤20 digits before and ≤10 digits after dot, got ${num}`,
    );
}

export function numberToValidNumberOrUndefined(
  value: number,
  round = true,
): ValidNumber | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  let num = value;
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot));
  if (num === 0) num = 0;
  if (!number_isValidNumber(num)) return undefined;
  return num;
}

export function number_toValidNumber_unsafe(num: number): ValidNumber {
  return num as ValidNumber;
}

export function strToNumberOrUndefined_lenient(
  value: string,
): ValidNumber | undefined {
  let num = parseFloat(value);
  num = Number(num.toFixed(validNumber__maxDigitsAfterDot));
  if (!number_isValidNumber(num)) return undefined;
  return num;
}

export function strToNumberOrUndefined_strict(
  value: string,
): ValidNumber | undefined {
  if (value !== value.trim()) return undefined;
  if (value === "") return undefined;
  let num = Number(value);
  num = Number(num.toFixed(validNumber__maxDigitsAfterDot));
  if (!number_isValidNumber(num)) return undefined;
  return num;
}

export function strToNumberOrThrow_lenient(value: string): ValidNumber {
  const n = strToNumberOrUndefined_lenient(value);
  if (n === undefined) throw new Error(`Invalid number: "${value}"`);
  return n;
}

export function strToNumberOrThrow_strict(value: string): ValidNumber {
  const n = strToNumberOrUndefined_strict(value);
  if (n === undefined) throw new Error(`Invalid number: "${value}"`);
  return n;
}

export function strOrNumberToNumberOrUndefined_lenient(
  value: string | number,
): undefined | ValidNumber {
  if (typeof value === "number")
    return numberToValidNumberOrUndefined(value, true);
  return strToNumberOrUndefined_lenient(value);
}

export function strOrNumberToNumberOrUndefined_strict(
  value: string | number,
): undefined | ValidNumber {
  if (typeof value === "number")
    return numberToValidNumberOrUndefined(value, true);
  return strToNumberOrUndefined_strict(value);
}

export function strOrNumberToNumberOrThrow_lenient(
  value: string | number,
): ValidNumber {
  const n = strOrNumberToNumberOrUndefined_lenient(value);
  if (n === undefined) throw new Error(`Invalid number: "${value}"`);
  return n;
}

export function strOrNumberToNumberOrThrow_strict(
  value: string | number,
): ValidNumber {
  const n = strOrNumberToNumberOrUndefined_strict(value);
  if (n === undefined) throw new Error(`Invalid number: "${value}"`);
  return n;
}

export function unknownToNumberOrUndefined_lenient(
  value: unknown,
): undefined | ValidNumber {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToNumberOrUndefined_lenient(value);
}

export function unknownToNumberOrUndefined_strict(
  value: unknown,
): undefined | ValidNumber {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToNumberOrUndefined_strict(value);
}

export function unknownToNumberOrThrow_lenient(value: unknown): ValidNumber {
  const n = unknownToNumberOrUndefined_lenient(value);
  if (n === undefined) throw new Error(`Invalid number: "${value}"`);
  return n;
}

export function unknownToNumberOrThrow_strict(value: unknown): ValidNumber {
  const n = unknownToNumberOrUndefined_strict(value);
  if (n === undefined) throw new Error(`Invalid number: "${value}"`);
  return n;
}

export type ValidNonNegativeNumber = ValidNumber & {
  readonly __ValidNumberBrand: "ValidNumber";
};

export function validNumber_isValidNonNegativeNumber(
  num: ValidNumber,
): num is ValidNonNegativeNumber {
  return num >= 0;
}

export function number_isValidNonNegativeNumber(
  num: number,
): num is ValidNonNegativeNumber {
  return number_isValidNumber(num) && validNumber_isValidNonNegativeNumber(num);
}

export function number_throwIfNotValidNonNegativeNumber(
  num: number,
): asserts num is ValidNonNegativeNumber {
  if (!number_isValidNonNegativeNumber(num))
    throw new TypeError(
      `Invalid non-negative number: must be ≥ 0 and have ≤20 digits before and ≤10 after dot, got ${num}`,
    );
}

export function numberToValidNonNegativeNumberOrUndefined(
  value: number,
  round = true,
  clamp = false,
): ValidNonNegativeNumber | undefined {
  if (typeof value !== "number") return undefined;
  if (!Number.isFinite(value)) return undefined;
  let num = value;
  if (clamp && num < 0) num = 0;
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot));
  if (num === 0) num = 0;
  if (!number_isValidNonNegativeNumber(num)) return undefined;
  return num;
}

export function number_toValidNonNegativeNumber_unsafe(
  num: number,
): ValidNonNegativeNumber {
  return num as ValidNonNegativeNumber;
}

export function strToNonNegativeNumberOrUndefined_lenient(
  value: string,
): ValidNonNegativeNumber | undefined {
  const num = strToNumberOrUndefined_lenient(value);
  if (num === undefined) return undefined;
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined;
  return num;
}

export function strToNonNegativeNumberOrUndefined_strict(
  value: string,
): ValidNonNegativeNumber | undefined {
  const num = strToNumberOrUndefined_strict(value);
  if (num === undefined) return undefined;
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined;
  return num;
}

export function strToNonNegativeNumberOrThrow_lenient(
  value: string,
): ValidNonNegativeNumber {
  const n = strToNonNegativeNumberOrUndefined_lenient(value);
  if (n === undefined)
    throw new Error(`Expected non-negative number, got: "${value}"`);
  return n;
}

export function strToNonNegativeNumberOrThrow_strict(
  value: string,
): ValidNonNegativeNumber {
  const n = strToNonNegativeNumberOrUndefined_strict(value);
  if (n === undefined)
    throw new Error(`Expected non-negative number, got: "${value}"`);
  return n;
}

export function strOrNumberToNonNegativeNumberOrUndefined_lenient(
  value: string | number,
): undefined | ValidNonNegativeNumber {
  if (typeof value === "number")
    return numberToValidNonNegativeNumberOrUndefined(value, true, false);
  return strToNonNegativeNumberOrUndefined_lenient(value);
}

export function strOrNumberToNonNegativeNumberOrUndefined_strict(
  value: string | number,
): undefined | ValidNonNegativeNumber {
  if (typeof value === "number")
    return numberToValidNonNegativeNumberOrUndefined(value, true, false);
  return strToNonNegativeNumberOrUndefined_strict(value);
}

export function strOrNumberToNonNegativeNumberOrThrow_lenient(
  value: string | number,
): ValidNonNegativeNumber {
  const n = strOrNumberToNonNegativeNumberOrUndefined_lenient(value);
  if (n === undefined)
    throw new Error(`Expected non-negative number, got: "${value}"`);
  return n;
}

export function strOrNumberToNonNegativeNumberOrThrow_strict(
  value: string | number,
): ValidNonNegativeNumber {
  const n = strOrNumberToNonNegativeNumberOrUndefined_strict(value);
  if (n === undefined)
    throw new Error(`Expected non-negative number, got: "${value}"`);
  return n;
}

export function unknownToNonNegativeNumberOrUndefined_lenient(
  value: unknown,
): undefined | ValidNonNegativeNumber {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToNonNegativeNumberOrUndefined_lenient(value);
}

export function unknownToNonNegativeNumberOrUndefined_strict(
  value: unknown,
): undefined | ValidNonNegativeNumber {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToNonNegativeNumberOrUndefined_strict(value);
}

export function unknownToNonNegativeNumberOrThrow_lenient(
  value: unknown,
): ValidNonNegativeNumber {
  const n = unknownToNonNegativeNumberOrUndefined_lenient(value);
  if (n === undefined)
    throw new Error(`Expected non-negative number, got: "${value}"`);
  return n;
}

export function unknownToNonNegativeNumberOrThrow_strict(
  value: unknown,
): ValidNonNegativeNumber {
  const n = unknownToNonNegativeNumberOrUndefined_strict(value);
  if (n === undefined)
    throw new Error(`Expected non-negative number, got: "${value}"`);
  return n;
}

export type ValidPercent = ValidNonNegativeNumber & {
  readonly __ValidPercentBrand: "ValidPercent";
};

export function validNonNegativeNumber_isValidPercent(
  num: ValidNonNegativeNumber,
): num is ValidPercent {
  return num <= 100;
}

export function number_isValidPercent(num: number): num is ValidPercent {
  return (
    number_isValidNonNegativeNumber(num) &&
    validNonNegativeNumber_isValidPercent(num)
  );
}

export const number_inPercentRange = number_isValidPercent;

export function number_throwIfNotInPercentRange(
  num: number,
): asserts num is ValidPercent {
  if (!number_isValidPercent(num))
    throw new TypeError(
      `Percent must be between 0 and 100 inclusive, got ${num}`,
    );
}

export function numberToValidPercentOrUndefined(
  value: number,
  round = true,
  clamp = true,
): ValidPercent | undefined {
  if (!Number.isFinite(value)) return undefined;
  let num = value;
  if (clamp) num = Math.min(100, Math.max(0, num));
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot));
  if (num === 0) num = 0;
  if (!number_isValidPercent(num)) return undefined;
  return num;
}

export function number_toValidPercent_unsafe(num: number): ValidPercent {
  return num as ValidPercent;
}

export function strToPercentOrUndefined_lenient(
  value: string,
  round = true,
  clamp = true,
): ValidPercent | undefined {
  let num: number | undefined = strToNumberOrUndefined_lenient(value);
  if (num === undefined) return undefined;
  if (clamp) num = Math.min(100, Math.max(0, num));
  if (round) num = Number(num.toFixed(validNumber__maxDigitsAfterDot));
  if (!number_isValidPercent(num)) return undefined;
  return num;
}

export function strToPercentOrUndefined_strict(
  value: string,
  round = true,
  clamp = true,
): ValidPercent | undefined {
  const num = strToNumberOrUndefined_strict(value);
  if (num === undefined) return undefined;
  if (!validNumber_isValidNonNegativeNumber(num)) return undefined;
  let result: number = num;
  if (clamp) result = Math.min(100, Math.max(0, result));
  if (round) result = Number(result.toFixed(validNumber__maxDigitsAfterDot));
  if (!number_isValidPercent(result)) return undefined;
  return result;
}

export function strToPercentOrThrow_lenient(
  value: string,
  round = true,
  clamp = true,
): ValidPercent {
  const n = strToPercentOrUndefined_lenient(value, round, clamp);
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`);
  return n;
}

export function strToPercentOrThrow_strict(
  value: string,
  round = true,
  clamp = true,
): ValidPercent {
  const n = strToPercentOrUndefined_strict(value, round, clamp);
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`);
  return n;
}

export function strOrNumberToPercentOrUndefined_lenient(
  value: string | number,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value === "number")
    return numberToValidPercentOrUndefined(value, round, clamp);
  return strToPercentOrUndefined_lenient(value, round, clamp);
}

export function strOrNumberToPercentOrUndefined_strict(
  value: string | number,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value === "number")
    return numberToValidPercentOrUndefined(value, round, clamp);
  return strToPercentOrUndefined_strict(value, round, clamp);
}

export function strOrNumberToPercentOrThrow_lenient(
  value: string | number,
  round = true,
  clamp = true,
): ValidPercent {
  const n = strOrNumberToPercentOrUndefined_lenient(value, round, clamp);
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`);
  return n;
}

export function strOrNumberToPercentOrThrow_strict(
  value: string | number,
  round = true,
  clamp = true,
): ValidPercent {
  const n = strOrNumberToPercentOrUndefined_strict(value, round, clamp);
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`);
  return n;
}

export function unknownToPercentOrUndefined_lenient(
  value: unknown,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToPercentOrUndefined_lenient(value, round, clamp);
}

export function unknownToPercentOrUndefined_strict(
  value: unknown,
  round = true,
  clamp = true,
): undefined | ValidPercent {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToPercentOrUndefined_strict(value, round, clamp);
}

export function unknownToPercentOrThrow_lenient(
  value: unknown,
  round = true,
  clamp = true,
): ValidPercent {
  const n = unknownToPercentOrUndefined_lenient(value, round, clamp);
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`);
  return n;
}

export function unknownToPercentOrThrow_strict(
  value: unknown,
  round = true,
  clamp = true,
): ValidPercent {
  const n = unknownToPercentOrUndefined_strict(value, round, clamp);
  if (n === undefined) throw new Error(`Invalid percent: "${value}"`);
  return n;
}

export function percentOf(
  part: ValidNonNegativeNumber,
  whole: ValidNonNegativeNumber,
): ValidPercent {
  const pct = (part / whole) * 100;
  return pct as ValidPercent;
}

export type ValidInt = ValidNumber & { readonly __ValidIntBrand: "ValidInt" };

export function number_isValidInt(num: number): num is ValidInt {
  return Number.isInteger(num);
}

export function number_throwIfNotValidInt(
  num: number,
): asserts num is ValidInt {
  if (!number_isValidInt(num))
    throw new TypeError(
      `Invalid integer: must be whole number with ≤20 digits before dot, got ${num}`,
    );
}

export function numberToValidIntOrUndefined(
  value: number,
  round = true,
): ValidInt | undefined {
  if (typeof value !== "number") return undefined;
  let num = value;
  if (round) num = Math.round(num);
  if (num === 0) num = 0;
  if (!number_isValidInt(num)) return undefined;
  return num;
}

export function number_toValidInt_unsafe(num: number): ValidInt {
  return num as ValidInt;
}

export function strToIntOrUndefined_lenient(
  value: string,
): ValidInt | undefined {
  const num = parseInt(value, 10);
  if (!number_isValidInt(num)) return undefined;
  return num;
}

export function strToIntOrUndefined_strict(
  value: string,
  round: boolean = true,
): ValidInt | undefined {
  if (value !== value.trim()) return undefined;
  if (value === "") return undefined;
  let num = Number(value);
  if (round) num = Math.round(num);
  if (!number_isValidInt(num)) return undefined;
  return num;
}

export function strToIntOrThrow_lenient(value: string): ValidInt {
  const n = strToIntOrUndefined_lenient(value);
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`);
  return n;
}

export function strToIntOrThrow_strict(
  value: string,
  round: boolean = true,
): ValidInt {
  const n = strToIntOrUndefined_strict(value, round);
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`);
  return n;
}

export function strOrNumberToIntOrUndefined_lenient(
  value: string | number,
): undefined | ValidInt {
  if (typeof value === "number")
    return numberToValidIntOrUndefined(value, true);
  return strToIntOrUndefined_lenient(value);
}

export function strOrNumberToIntOrUndefined_strict(
  value: string | number,
  round: boolean = true,
): undefined | ValidInt {
  if (typeof value === "number")
    return numberToValidIntOrUndefined(value, round);
  return strToIntOrUndefined_strict(value, round);
}

export function strOrNumberToIntOrThrow_lenient(
  value: string | number,
): ValidInt {
  const n = strOrNumberToIntOrUndefined_lenient(value);
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`);
  return n;
}

export function strOrNumberToIntOrThrow_strict(
  value: string | number,
  round: boolean = true,
): ValidInt {
  const n = strOrNumberToIntOrUndefined_strict(value, round);
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`);
  return n;
}

export function unknownToIntOrUndefined_lenient(
  value: unknown,
): undefined | ValidInt {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToIntOrUndefined_lenient(value);
}

export function unknownToIntOrUndefined_strict(
  value: unknown,
  round: boolean = true,
): undefined | ValidInt {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return strOrNumberToIntOrUndefined_strict(value, round);
}

export function unknownToIntOrThrow_lenient(value: unknown): ValidInt {
  const n = unknownToIntOrUndefined_lenient(value);
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`);
  return n;
}

export function unknownToIntOrThrow_strict(
  value: unknown,
  round: boolean = true,
): ValidInt {
  const n = unknownToIntOrUndefined_strict(value, round);
  if (n === undefined) throw new Error(`Invalid integer: "${value}"`);
  return n;
}
