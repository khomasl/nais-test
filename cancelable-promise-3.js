const throwsOnWrongArgument = (arg) => {
  if (typeof arg === "function") return;
  throw new Error("Wrong argument. Argument must be a function.");
};

class CancelablePromise {
  constructor(executor, queuePromises=[]) {
    throwsOnWrongArgument(executor);

    this.isCanceled = false;
    this.promise = new Promise((resolve, reject) => {
      try {
        executor(
          (value) =>
            this.isCanceled
              ? reject({ isCanceled: true, value })
              : resolve(value),
          (reason) => reject({ isCanceled: true, reason })
        );
      } catch (err) {
        reject(err);
      }
    });
    this.queuePromises = queuePromises ?? [];
    this.queuePromises.push(this);
  }

  then(onFulfilled = (r) => r, onRejected) {
    throwsOnWrongArgument(onFulfilled);

    const nextFulfilled = (value) =>
      this.isCanceled
        ? onRejected({ isCanceled: true, value })
        : onFulfilled(value);
    const nextRejected = (reason) => onRejected({ isCanceled: true, reason });

    const nextPromise = Promise.race([
      this.promise.then(nextFulfilled),
      nextRejected,
    ]).catch(onRejected);

    return new CancelablePromise(
      (resolve, reject) => nextPromise.then(resolve, reject),
      this.queuePromises ?? [this]
    );
  }

  catch(onRejected) {
    this.then(undefined, onRejected);
    return this;
  }

  cancel() {
    this.queuePromises.forEach((promise) => (promise.isCanceled = true));
    this.then(() => ({ isCanceled: true }))
    // this.then(() => ({ isCanceled: true }))
  }
}

module.exports = CancelablePromise;
