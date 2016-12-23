declare namespace _ {
  // missing lodash typings
  interface LoDashExplicitObjectWrapper<T> {
    /**
     * @see _.merge
     */
    merge<TSource>(source: TSource,
                   customizer?: MergeCustomizer,
                   thisArg?: any): LoDashExplicitObjectWrapper<T & TSource>;

    /**
     * @see _.merge
     */
    merge<TSource1, TSource2>(source1: TSource1,
                              source2: TSource2,
                              customizer?: MergeCustomizer,
                              thisArg?: any): LoDashExplicitObjectWrapper<T & TSource1 & TSource2>;

    /**
     * @see _.merge
     */
    merge<TSource1, TSource2, TSource3>(source1: TSource1,
                                        source2: TSource2,
                                        source3: TSource3,
                                        customizer?: MergeCustomizer,
                                        thisArg?: any): LoDashExplicitObjectWrapper<T & TSource1 & TSource2 & TSource3>;

    /**
     * @see _.merge
     */
    merge<TSource1, TSource2, TSource3, TSource4>(source1: TSource1,
                                                  source2: TSource2,
                                                  source3: TSource3,
                                                  source4: TSource4,
                                                  customizer?: MergeCustomizer,
                                                  thisArg?: any): LoDashExplicitObjectWrapper<T & TSource1 & TSource2 & TSource3 & TSource4>;

    /**
     * @see _.merge
     */
    merge<TResult>(...otherArgs: any[]): LoDashExplicitObjectWrapper<TResult>;
  }
}
