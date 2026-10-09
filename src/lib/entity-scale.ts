import * as React from 'react'

/**
 * How large the people and companies inside a container are drawn. A
 * `<DataTable variant="large">` sets it to `large`, and a `<Person>` or
 * `<Company>` row inside reads it: a bigger face or logo, the name a step up.
 * The caller writes the same `<Person person={p} />` in every table; the
 * table decides the size.
 */
export type EntityScale = 'default' | 'large'

export const EntityScaleContext = React.createContext<EntityScale>('default')

export function useEntityScale(): EntityScale {
  return React.useContext(EntityScaleContext)
}
