/**
 * 函数式编程工具库
 * 提供常用的 FP 工具函数和类型
 */

import { Either, left, right } from 'fp-ts/lib/Either.js';
import * as E from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import * as O from 'fp-ts/lib/Option.js';
import type { Option } from 'fp-ts/lib/Option.js';

// ============= 类型别名 =============

export type Result<E, A> = Either<E, A>;
export type Maybe<A> = Option<A>;

// ============= 错误处理 =============

/**
 * 创建成功结果
 */
export const success = <A>(value: A): Result<Error, A> => right(value);

/**
 * 创建失败结果
 */
export const failure = <A = never>(error: Error | string): Result<Error, A> =>
  left(typeof error === 'string' ? new Error(error) : error);

/**
 * 从可能抛出异常的函数创建 Either
 */
export const tryCatch = <A>(
  fn: () => A,
  onError: (error: unknown) => Error = (e) =>
    e instanceof Error ? e : new Error(String(e))
): Result<Error, A> => {
  try {
    return right(fn());
  } catch (error) {
    return left(onError(error));
  }
};

/**
 * 异步版本的 tryCatch
 */
export const tryCatchAsync = async <A>(
  fn: () => Promise<A>,
  onError: (error: unknown) => Error = (e) =>
    e instanceof Error ? e : new Error(String(e))
): Promise<Result<Error, A>> => {
  try {
    const result = await fn();
    return right(result);
  } catch (error) {
    return left(onError(error));
  }
};

// ============= 验证函数 =============

/**
 * 验证邮箱格式
 */
export const validateEmail = (email: string): Result<Error, string> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? success(email)
    : failure('Invalid email format');
};

/**
 * 验证非空字符串
 */
export const validateNonEmpty = (
  value: string,
  fieldName: string = 'Field'
): Result<Error, string> =>
  value.trim().length > 0
    ? success(value)
    : failure(`${fieldName} cannot be empty`);

/**
 * 验证数字范围
 */
export const validateRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): Result<Error, number> =>
  value >= min && value <= max
    ? success(value)
    : failure(`${fieldName} must be between ${min} and ${max}`);

/**
 * 验证正数
 */
export const validatePositive = (
  value: number,
  fieldName: string = 'Value'
): Result<Error, number> =>
  value > 0 ? success(value) : failure(`${fieldName} must be positive`);

// ============= Option 工具 =============

/**
 * 从 nullable 值创建 Option
 */
export const fromNullable = <A>(value: A | null | undefined): Maybe<A> =>
  O.fromNullable(value);

/**
 * Option 转为默认值
 */
export const getOrElse = <A>(defaultValue: A) => (option: Maybe<A>): A =>
  pipe(
    option,
    O.getOrElse(() => defaultValue)
  );

// ============= 组合工具 =============

/**
 * 组合多个验证函数
 */
export const validateAll = <A>(
  ...validators: readonly ((value: A) => Result<Error, A>)[]
) => (value: A): Result<Error, A> =>
  validators.reduce(
    (acc, validator) => pipe(acc, E.chain(validator)),
    success(value)
  );

/**
 * 条件执行
 */
export const when = <A>(
  predicate: (value: A) => boolean,
  fn: (value: A) => A
) => (value: A): A => (predicate(value) ? fn(value) : value);

// ============= 日期工具 =============

/**
 * 验证日期
 */
export const validateDate = (date: string): Result<Error, Date> => {
  const parsed = new Date(date);
  return isNaN(parsed.getTime())
    ? failure('Invalid date format')
    : success(parsed);
};

/**
 * 验证未来日期
 */
export const validateFutureDate = (date: string): Result<Error, Date> =>
  pipe(
    validateDate(date),
    E.chain((d) =>
      d > new Date() ? success(d) : failure('Date must be in the future')
    )
  );

// ============= 导出常用函数 =============

export { pipe, E, O };
export type { Either, Option };
