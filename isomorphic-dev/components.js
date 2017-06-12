import { application, component, pathMatch, Pick, When, Otherwise, Preload } from '../bin/index';

export const Page1 = component(kit => {
  return props => (
    <div>
      This is page {props.num}.
      <When ok={kit.data.ok('MY_DATA')}>
        <div>{kit.data.value('MY_DATA')}</div>
      </When>
    </div>
  )
})

export const Page2 = component(kit => {
  return props => (
    <div>
      This is page {props.num}.
    </div>
  )
})

export const Router = component(kit => {
  return props => {
    console.log('I ran over here! I should be in the bash console and the browser console!')
    return (
      <Pick>
        <When path={'/'}><Page1 num={1} /></When>
        <Otherwise><Page2 num={2} /></Otherwise>
      </Pick>
    )
  }
})
