import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState('')
    const [ project, setProject ] = useState([])

    const navigate = useNavigate()

    function fetchProjects() {
        axios.get('/projects/all').then((res) => {
            setProject(Array.isArray(res.data) ? res.data : [])
        }).catch(err => {
            console.log(err)
        })
    }

    function createProject(e) {
        e.preventDefault()
        const normalizedName = projectName.trim()

        if (!normalizedName) return

        axios.post('/projects/create', {
            name: normalizedName,
        })
            .then((res) => {
                const createdProject = res.data
                if (createdProject?._id) {
                    setProject(prev => [ createdProject, ...prev ])
                } else {
                    fetchProjects()
                }
                setProjectName('')
                setIsModalOpen(false)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    return (
        <main className='app-shell p-4 md:p-6'>
            <header className='mb-6 flex flex-wrap items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl font-semibold md:text-3xl'>Projects</h1>
                    <p className='text-sm text-neutral-400'>Welcome back, {user?.email}</p>
                </div>
            </header>

            <div className="projects grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="project panel min-h-32 p-4 text-left hover:border-blue-600 hover:bg-neutral-800">
                    <div className='mb-4 flex items-center justify-between'>
                        <p className='text-lg font-semibold'>New Project</p>
                        <i className="ri-add-circle-line text-xl text-blue-400"></i>
                    </div>
                    <p className='text-sm text-neutral-400'>Start a new collaboration workspace.</p>
                </button>

                {
                    project.map((project) => (
                        <div key={project._id}
                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="project panel flex min-h-32 cursor-pointer flex-col gap-2 p-4 hover:border-blue-600 hover:bg-neutral-800">
                            <h2
                                className='font-semibold text-neutral-100'
                            >{project.name}</h2>

                            <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <p><small><i className="ri-user-line"></i> Collaborators</small></p>
                                <span className='rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-200'>{project.users.length}</span>
                            </div>

                        </div>
                    ))
                }


            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
                    <div className="panel w-full max-w-md p-6 shadow-2xl">
                        <h2 className="mb-4 text-xl font-semibold text-neutral-100">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-neutral-300">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" className="input-control mt-1" required />
                            </div>
                            <div className="flex justify-end">
                                <button type="button" className="btn btn-secondary mr-2" onClick={() => {
                                    setIsModalOpen(false)
                                    setProjectName('')
                                }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </main>
    )
}

export default Home