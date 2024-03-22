const throwsOnWrongArgument = (arg) => {
  if (typeof arg === "function") return;
  throw new Error("Wrong argument. Argument must be a function.");
};

class CancelablePromise {
  constructor(executor) {
    throwsOnWrongArgument(executor);

    this.isCanceled = false;
    this.promise = new Promise((resolve, reject) => {
      try {
        executor(
          (value) => this.handler(value, resolve),
          (reason) => this.handler(reason, reject)
        );
      } catch (err) {
          reject(err);
      }
    });
  }

  then(onFulfilled = (r) => r, onRejected) {
    throwsOnWrongArgument(onFulfilled)

    const nextFulfilled = (value) => this.handler(value, onFulfilled);
    const nextRejected = (reason) => this.handler(reason, onRejected);
    
    const nextPromise = Promise.race([
      this.promise.then(nextFulfilled),
      nextRejected,
    ]).catch(onRejected);
    
    return new CancelablePromise((resolve, reject) =>
      nextPromise.then(resolve, reject)
    );
  }

  catch(onRejected) {
    this.then(undefined, onRejected);
    return this;
  }

  cancel() {
    return {
      ...this,
      isCanceled: true
    };
  }

  handler = (value, onHandle) =>
    !this.isCanceled ? onHandle(value) : undefined;
}

module.exports = CancelablePromise;