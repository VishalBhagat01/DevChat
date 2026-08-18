import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const Login = () => {


    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()

    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/login', {
            email,
            password
        }).then((res) => {
            console.log(res.data)

            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)

            navigate('/')
        }).catch((err) => {
            console.log(err.response.data)
        })
    }

    return (
        <div className="app-shell flex items-center justify-center p-4">
            <div className="panel w-full max-w-md p-8 shadow-2xl">
                <h2 className="mb-1 text-2xl font-bold text-neutral-100">Login</h2>
                <p className='mb-6 text-sm text-neutral-400'>Sign in to continue to your workspace.</p>
                <form
                    onSubmit={submitHandler}
                >
                    <div className="mb-4">
                        <label className="mb-2 block text-neutral-300" htmlFor="email">Email</label>
                        <input

                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="input-control"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="mb-2 block text-neutral-300" htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="input-control"
                            placeholder="Enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                    >
                        Login
                    </button>
                </form>
                <p className="mt-4 text-neutral-400">
                    Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300">Create one</Link>
                </p>
            </div>
        </div>
    )
}

export default Login