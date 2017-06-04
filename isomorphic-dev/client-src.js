import { application } from '../bin/index';
import { Router, Page1, Page2 } from './components';

const ClientApplication = application(appKit => {
  appKit.renderIn('#root')
  return props => {
    return <Router path={location.pathname} />
  }
})

const ClientApplication2 = application(appKit => {
  appKit.renderIn('#root2')
  return props => {
    return <div>This is the second application.</div>
  }
})
