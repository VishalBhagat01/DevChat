import React, { useContext, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import UserContext from '../context/user.context'
import axios from '../config/axios'

const UserAuth = ({ children }) => {
  const { user, setUser } = useContext(UserContext)
  const token = localStorage.getItem('token')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    if (user) {
      setLoading(false)
      return
    }

    axios.get('/users/profile')
      .then((res) => {
        setUser(res.data.user)
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token, user, setUser])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default UserAuth