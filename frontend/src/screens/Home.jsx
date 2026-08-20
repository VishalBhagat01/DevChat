import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [projectName, setProjectName] = useState('')
    const [project, setProject] = useState([])

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
                    setProject(prev => [createdProject, ...prev])
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
        <main className="min-h-screen bg-[#0a0a0a] text-white">

            {/* Page Header */}
            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

                <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                            <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                                Workspace
                            </span>
                        </div>

                        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            Projects
                        </h1>

                        <p className="mt-2 text-sm text-neutral-500">
                            Welcome back,{' '}
                            <span className="text-neutral-300">
                                {user?.email}
                            </span>
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-950/30 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-900/40 active:scale-[0.98]"
                    >
                        <i className="ri-add-line text-lg transition-transform duration-200 group-hover:rotate-90"></i>
                        New Project
                    </button>

                </header>

                {/* Projects */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                    {/* Create Project Card */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group relative min-h-[170px] overflow-hidden rounded-xl border border-dashed border-neutral-800 bg-neutral-950/60 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-neutral-900"
                    >
                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-600/5 blur-2xl transition-all duration-300 group-hover:bg-blue-600/10" />

                        <div className="relative flex h-full flex-col">

                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20">
                                    <i className="ri-add-line text-xl"></i>
                                </div>

                                <i className="ri-arrow-right-up-line text-lg text-neutral-700 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-400"></i>
                            </div>

                            <div className="mt-auto">
                                <h2 className="text-base font-semibold text-neutral-100">
                                    Create a project
                                </h2>

                                <p className="mt-1 text-sm leading-5 text-neutral-500">
                                    Start a new collaboration workspace.
                                </p>
                            </div>

                        </div>
                    </button>

                    {/* Project Cards */}
                    {project.map((project) => (
                        <div
                            key={project._id}
                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="group relative min-h-[170px] cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-[#111111] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-700 hover:bg-[#151515] hover:shadow-xl hover:shadow-black/20"
                        >

                            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-500/5 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                            <div className="relative flex h-full flex-col">

                                <div className="mb-5 flex items-start justify-between">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 ring-1 ring-inset ring-neutral-700">
                                        <i className="ri-folder-3-line text-lg"></i>
                                    </div>

                                    <div className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition-colors group-hover:text-neutral-300">
                                        <i className="ri-arrow-right-up-line"></i>
                                    </div>

                                </div>

                                <div className="mt-auto">

                                    <h2 className="truncate text-base font-semibold text-neutral-100">
                                        {project.name}
                                    </h2>

                                    <div className="mt-3 flex items-center gap-2">

                                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                            <i className="ri-group-line"></i>
                                            <span>Collaborators</span>
                                        </div>

                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-800 px-1.5 text-[11px] font-medium text-neutral-300 ring-1 ring-inset ring-neutral-700">
                                            {project.users.length}
                                        </span>

                                    </div>

                                </div>

                            </div>
                        </div>
                    ))}

                </div>

                {/* Empty State */}
                {project.length === 0 && (
                    <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/50 px-6 py-12 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-neutral-600 ring-1 ring-inset ring-neutral-800">
                            <i className="ri-folder-open-line text-xl"></i>
                        </div>

                        <h3 className="text-sm font-medium text-neutral-300">
                            No projects yet
                        </h3>

                        <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-600">
                            Create your first project to start collaborating.
                        </p>
                    </div>
                )}

            </div>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => {
                        setIsModalOpen(false)
                        setProjectName('')
                    }}
                >

                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-[#111111] shadow-2xl shadow-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Modal Header */}
                        <div className="border-b border-neutral-800 px-6 py-5">

                            <div className="flex items-start justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20">
                                        <i className="ri-folder-add-line text-xl"></i>
                                    </div>

                                    <div>
                                        <h2 className="text-base font-semibold text-white">
                                            Create new project
                                        </h2>

                                        <p className="mt-0.5 text-xs text-neutral-500">
                                            Set up your new workspace
                                        </p>
                                    </div>

                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        setProjectName('')
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                                >
                                    <i className="ri-close-line text-lg"></i>
                                </button>

                            </div>

                        </div>

                        {/* Modal Body */}
                        <form onSubmit={createProject}>

                            <div className="px-6 py-6">

                                <label className="mb-2 block text-sm font-medium text-neutral-300">
                                    Project name
                                </label>

                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text"
                                    placeholder="e.g. DevChat"
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none placeholder:text-neutral-700 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                    required
                                    autoFocus
                                />

                                <p className="mt-2 text-xs text-neutral-600">
                                    Choose a name that clearly identifies your workspace.
                                </p>

                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950/50 px-6 py-4">

                                <button
                                    type="button"
                                    className="rounded-lg border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-200"
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        setProjectName('')
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-950/30 transition-all duration-200 hover:bg-blue-500 active:scale-[0.98]"
                                >
                                    Create project
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </main>
    )
}

export default Home