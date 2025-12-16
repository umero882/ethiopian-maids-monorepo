/**
 * Result Type - Functional Error Handling
 *
 * A type-safe way to handle success and failure cases without throwing exceptions.
 * Inspired by Rust's Result type and functional programming patterns.
 *
 * @example
 * ```typescript
 * const result = await useCase.execute(data);
 *
 * if (result.isSuccess) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: string;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: string, value?: T) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  /**
   * Get the value of a successful result
   * Throws if result is a failure
   */
  public get value(): T {
    if (!this.isSuccess) {
      throw new Error(`Can't get the value of an error result. Use 'errorValue' instead.`);
    }

    return this._value as T;
  }

  /**
   * Get the error value
   * Throws if result is a success
   */
  public get errorValue(): string {
    if (this.isSuccess) {
      throw new Error(`Can't get the error value of a success result.`);
    }

    return this.error as string;
  }

  /**
   * Create a successful result
   */
  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  /**
   * Create a failed result
   */
  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }

  /**
   * Combine multiple results
   * Returns the first failure, or success if all succeed
   */
  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) return result;
    }
    return Result.ok();
  }

  /**
   * Map the value of a successful result
   */
  public map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail(this.error!);
    }
    return Result.ok(fn(this.value));
  }

  /**
   * Flat map the value of a successful result
   */
  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.fail(this.error!);
    }
    return fn(this.value);
  }
}

/**
 * Result with typed error
 */
export class ResultWithError<T, E> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: E;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: E, value?: T) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;
    Object.freeze(this);
  }

  public get value(): T {
    if (!this.isSuccess) {
      throw new Error(`Can't get the value of an error result.`);
    }
    return this._value as T;
  }

  public static ok<U, E>(value?: U): ResultWithError<U, E> {
    return new ResultWithError<U, E>(true, undefined, value);
  }

  public static fail<U, E>(error: E): ResultWithError<U, E> {
    return new ResultWithError<U, E>(false, error);
  }
}
