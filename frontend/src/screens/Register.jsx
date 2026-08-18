import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()


    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/register', {
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
                <h2 className="mb-1 text-2xl font-bold text-neutral-100">Register</h2>
                <p className='mb-6 text-sm text-neutral-400'>Create an account to start collaborating.</p>
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
                        Register
                    </button>
                </form>
                <p className="mt-4 text-neutral-400">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default Register