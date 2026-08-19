import React, { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user.context'

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const submitHandler = async (e) => {
        e.preventDefault()

        try {
            const { data } = await axios.post('/users/login', formData)

            console.log(data)

            localStorage.setItem('token', data.token)
            setUser(data.user)

            navigate('/')
        } catch (err) {
            console.log(err.response?.data)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur">

                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                      Welcome Back
                    </h1>

                    <p className="mt-3 text-zinc-400">
                        Sign in to continue to{' '}
                        <span className="text-white">your workspace</span>.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submitHandler} className="space-y-5">

                    {/* Email */}
                    <div>
                      

                        <input
                            name="email"
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email"
                            required
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                        />
                    </div>

                    {/* Password */}
                    <div>
                      

                        <input
                            name="password"
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Password"
                            required
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
                    >
                        Login
                    </button>

                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-zinc-400">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="font-medium text-violet-400 transition hover:text-violet-300"
                    >
                        Sign up
                    </button>
                </p>

            </div>
        </div>
    )
}

export default Login