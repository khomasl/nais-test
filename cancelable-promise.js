const throwsOnWrongArgument = (arg) => {
  if (typeof arg === "function") return;
  throw new Error("Wrong argument. Argument must be a function.");
};

class CancelablePromise {
  constructor(
    callback,
    currentPromise = null,
    isCanceled = false,
    chainOfPromises = []
  ) {
    if (!currentPromise) throwsOnWrongArgument(callback);

    this.isCanceled = isCanceled;

    this._currentPromise =
      currentPromise ??
      new Promise((resolve, reject) => {
        callback(
          (result) => {
            if (this.isCanceled) reject({ isCanceled: true });
            else resolve(result);
          },
          (error) => {
            if (this.isCanceled) reject({ isCanceled: true });
            else reject(error);
          }
        );
      });

    this._chainOfPromises = chainOfPromises;

    this._chainOfPromises.push(this);
  }

  then(onCompleted = (res) => res, onError) {
    throwsOnWrongArgument(onCompleted);

    const { _currentPromise } = this;

    const cancellationPromise = new Promise((_, reject) => {
      this._chainOfPromises.push({ reject });
    });

    const nextPromise = Promise.race([
      _currentPromise.then(onCompleted),
      cancellationPromise,
    ]).catch(onError);

    return new CancelablePromise(
      null,
      nextPromise,
      this.isCanceled,
      this._chainOfPromises
    );
  }

  catch(onError) {
    return this.then(undefined, onError);
  }

  cancel() {
    this._chainOfPromises.forEach((promise) => (promise.isCanceled = true));

    return this;
  }
}

module.exports = CancelablePromise;
