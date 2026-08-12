import React from 'react'
import { Switch, Route } from 'react-router-dom'

const AppRoutes = () => {
  return (
    <Switch>
      <Route path="/" exact component={App} />
    </Switch>
  )
}

export default AppRoutes