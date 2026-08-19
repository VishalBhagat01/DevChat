import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

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
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 px-6">

            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur">

                {/* Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                        Create Your Account
                    </h1>

                    <p className="mt-3 text-zinc-400">
                        Join <span className="font-medium text-white">DevChat</span> and start collaborating.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submitHandler} className="space-y-5">

                    {/* Email */}
                    <div>


                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            id="email"
                            required
                            placeholder="Email"
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                        />
                    </div>

                    {/* Password */}
                    <div>
                    

                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            id="password"
                            required
                            placeholder="Password"
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                        />
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
                    >
                        Create Account
                    </button>

                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-sm text-zinc-400">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-medium text-violet-400 transition hover:text-violet-300"
                    >
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default Register