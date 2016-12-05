type BeforeCallback<F extends Function> = OnCallback<void, F>;
type AfterCallback<R> = OnCallback<R, R>;
type OnCallback<R, T> = (className: string, objectId: string, result?: R, func?: Function, args?: any[]) => T;

// matching rules: {className, objectId?} + application of {apiFilter/eventFilter}
// BeforeCallbacks
