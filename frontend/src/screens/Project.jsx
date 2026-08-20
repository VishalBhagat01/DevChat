import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import {
    disconnectSocket,
    initializeSocket,
    receiveMessage,
    sendMessage
} from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { getWebContainer } from '../config/webcontainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-')) {
            hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()
    const { user } = useContext(UserContext)
    const navigate = useNavigate()

    const projectId = location.state?.project?._id

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [selectedUserId, setSelectedUserId] = useState(new Set())

    const [project, setProject] = useState(
        location.state?.project || null
    )

    const [message, setMessage] = useState('')
    const messageBox = useRef(null)

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])

    const [fileTree, setFileTree] = useState({})

    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])

    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)

    const [runProcess, setRunProcess] = useState(null)


    /* =========================================================
       USER HELPERS
    ========================================================= */

    const getUserId = (value) => {
        if (!value) return null

        if (typeof value === 'string') {
            return value
        }

        return value._id?.toString?.() || value._id || null
    }


    const getUserEmail = (projectUser) => {

        // Already populated
        if (
            typeof projectUser === 'object' &&
            projectUser?.email
        ) {
            return projectUser.email
        }

        const projectUserId = getUserId(projectUser)

        if (!projectUserId) {
            return 'Unknown user'
        }

        const foundUser = users.find(
            u => getUserId(u) === projectUserId
        )

        return foundUser?.email || 'Unknown user'
    }


    const getUserInitial = (projectUser) => {

        const email = getUserEmail(projectUser)

        if (!email || email === 'Unknown user') {
            return '?'
        }

        return email.charAt(0).toUpperCase()
    }


    /* =========================================================
       COLLABORATOR SELECTION
    ========================================================= */

    const handleUserClick = (id) => {

        setSelectedUserId(prevSelectedUserId => {

            const newSelectedUserId =
                new Set(prevSelectedUserId)

            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id)
            } else {
                newSelectedUserId.add(id)
            }

            return newSelectedUserId
        })
    }


    function addCollaborators() {

        if (!projectId) return

        axios.put("/projects/add-user", {
            projectId,
            users: Array.from(selectedUserId)
        })
            .then(res => {

                console.log(res.data)

                setProject(
                    res.data.project || project
                )

                setIsModalOpen(false)
                setSelectedUserId(new Set())

            })
            .catch(err => {
                console.log(err)
            })
    }


    /* =========================================================
       CHAT
    ========================================================= */

    const send = () => {

        const trimmedMessage = message.trim()

        if (!trimmedMessage) return

        sendMessage('project-message', {
            message: trimmedMessage,
            sender: user
        })

        setMessages(prevMessages => [
            ...prevMessages,
            {
                sender: user,
                message: trimmedMessage
            }
        ])

        setMessage("")
    }


    function WriteAiMessage(message) {

        let messageObject

        try {

            messageObject =
                typeof message === 'string'
                    ? JSON.parse(message)
                    : message

        } catch {

            return (
                <p className='whitespace-pre-wrap text-sm'>
                    {String(message)}
                </p>
            )
        }

        return (
            <div className='overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-neutral-100'>

                <Markdown
                    children={messageObject?.text || ''}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />

            </div>
        )
    }


    /* =========================================================
       INITIALIZE PROJECT
    ========================================================= */

    useEffect(() => {

        if (!projectId) {
            navigate('/')
            return
        }

        initializeSocket(projectId)


        getWebContainer()
            .then(container => {

                setWebContainer(container)

                console.log('container started')

            })
            .catch(err => {
                console.error(err)
            })


        const cleanupMessageListener =
            receiveMessage(
                'project-message',
                data => {

                    console.log(data)

                    if (data.sender?._id === 'ai') {

                        let aiMessage = null

                        try {

                            aiMessage =
                                typeof data.message === 'string'
                                    ? JSON.parse(data.message)
                                    : data.message

                        } catch {

                            aiMessage = null
                        }


                        if (aiMessage?.fileTree) {

                            setFileTree(
                                aiMessage.fileTree || {}
                            )
                        }


                        setMessages(prevMessages => [
                            ...prevMessages,
                            data
                        ])

                    } else {

                        setMessages(prevMessages => [
                            ...prevMessages,
                            data
                        ])
                    }
                }
            )


        /* =====================================================
           GET PROJECT
        ===================================================== */

        axios
            .get(`/projects/get-project/${projectId}`)
            .then(res => {

                console.log('PROJECT:', res.data)

                console.log(
                    'PROJECT USERS:',
                    res.data?.users
                )

                setProject(res.data)

                setFileTree(
                    res.data.fileTree || {}
                )

            })
            .catch(err => {

                console.log(
                    'Error fetching project:',
                    err
                )

            })


        /* =====================================================
           GET ALL USERS
        ===================================================== */

        axios
            .get('/users/all')
            .then(res => {

                console.log(
                    'ALL USERS:',
                    res.data.users
                )

                setUsers(
                    res.data.users || []
                )

            })
            .catch(err => {

                console.log(
                    'Error fetching users:',
                    err
                )

            })


        return () => {

            if (cleanupMessageListener) {
                cleanupMessageListener()
            }

            disconnectSocket()
        }

    }, [projectId, navigate])


    /* =========================================================
       AUTO SCROLL CHAT
    ========================================================= */

    useEffect(() => {

        if (messageBox.current) {

            messageBox.current.scrollTop =
                messageBox.current.scrollHeight

        }

    }, [messages])


    /* =========================================================
       SAVE FILE TREE
    ========================================================= */

    function saveFileTree(ft) {

        if (!project?._id) return

        axios
            .put('/projects/update-file-tree', {

                projectId: project._id,

                fileTree: ft

            })
            .then(res => {

                console.log(res.data)

            })
            .catch(err => {

                console.log(err)

            })
    }


    return (

        <main className='flex h-screen w-screen overflow-hidden bg-[#080808] text-neutral-100'>


            {/* =====================================================
                CHAT PANEL
            ===================================================== */}

            <section className='relative flex h-[52vh] min-w-0 flex-col border-b border-neutral-800 bg-[#0d0d0d] lg:h-screen lg:w-[28rem] lg:border-b-0 lg:border-r'>


                {/* Header */}

                <header className='z-20 flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#101010] px-4'>

                    <div className='flex min-w-0 items-center gap-3'>

                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20'>

                            <i className='ri-terminal-box-line'></i>

                        </div>


                        <div className='min-w-0'>

                            <h1 className='truncate text-sm font-semibold text-neutral-100'>

                                {project?.name || 'Project'}

                            </h1>

                            <p className='text-[11px] text-neutral-600'>

                                Collaboration workspace

                            </p>

                        </div>

                    </div>


                    <div className='flex items-center gap-1.5'>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            title='Add collaborator'
                            className='flex h-8 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 text-xs font-medium text-neutral-400 transition-all hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100'
                        >

                            <i className='ri-user-add-line'></i>

                            <span className='hidden sm:inline'>
                                Invite
                            </span>

                        </button>


                        <button
                            onClick={() =>
                                setIsSidePanelOpen(
                                    !isSidePanelOpen
                                )
                            }
                            title='View collaborators'
                            className='flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 transition-all hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100'
                        >

                            <i className='ri-group-line'></i>

                        </button>

                    </div>

                </header>


                {/* Messages */}

                <div className='relative flex min-h-0 flex-1 flex-col'>

                    <div
                        ref={messageBox}
                        className='message-box flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 scrollbar-hide'
                    >

                        {messages.length === 0 && (

                            <div className='flex flex-1 flex-col items-center justify-center px-6 text-center'>

                                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-neutral-600 ring-1 ring-inset ring-neutral-800'>

                                    <i className='ri-chat-3-line text-xl'></i>

                                </div>


                                <h2 className='text-sm font-medium text-neutral-300'>

                                    Start collaborating

                                </h2>


                                <p className='mt-1 max-w-xs text-xs leading-5 text-neutral-600'>

                                    Ask the AI for help, discuss code, or collaborate with your team.

                                </p>

                            </div>

                        )}


                        {messages.map((msg, index) => {

                            const isAI =
                                msg.sender?._id === 'ai'

                            const isCurrentUser =
                                msg.sender?._id ==
                                user?._id?.toString()


                            return (

                                <div
                                    key={index}
                                    className={`flex w-full ${isCurrentUser
                                        ? 'justify-end'
                                        : 'justify-start'
                                        }`}
                                >

                                    <div
                                        className={`
                                            flex max-w-[88%] flex-col
                                            ${isAI
                                                ? 'max-w-[32rem]'
                                                : 'sm:max-w-[80%]'
                                            }
                                        `}
                                    >

                                        <div
                                            className={`mb-1 flex items-center gap-2 px-1 ${isCurrentUser
                                                ? 'justify-end'
                                                : ''
                                                }`}
                                        >

                                            <span className='text-[10px] font-medium text-neutral-600'>

                                                {isAI
                                                    ? 'AI Assistant'
                                                    : msg.sender?.email ||
                                                    'Unknown'}

                                            </span>


                                            {isAI && (

                                                <span className='rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-400'>

                                                    AI

                                                </span>

                                            )}

                                        </div>


                                        <div
                                            className={`
                                                rounded-2xl border px-3.5 py-2.5 text-sm leading-6
                                                ${isCurrentUser
                                                    ? 'rounded-br-md border-blue-500/20 bg-blue-600 text-white shadow-lg shadow-blue-950/20'
                                                    : isAI
                                                        ? 'rounded-bl-md border-neutral-800 bg-[#111111] text-neutral-200'
                                                        : 'rounded-bl-md border-neutral-800 bg-neutral-900 text-neutral-200'
                                                }
                                            `}
                                        >

                                            {isAI
                                                ? WriteAiMessage(
                                                    msg.message
                                                )
                                                : (
                                                    <p className='whitespace-pre-wrap break-words'>
                                                        {msg.message}
                                                    </p>
                                                )}

                                        </div>

                                    </div>

                                </div>

                            )

                        })}

                    </div>


                    {/* Message Input */}

                    <div className='shrink-0 border-t border-neutral-800 bg-[#0d0d0d] p-3'>

                        <div className='flex items-end gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 transition-colors focus-within:border-neutral-700'>

                            <input
                                value={message}
                                onChange={(e) =>
                                    setMessage(e.target.value)
                                }
                                onKeyDown={(e) => {

                                    if (e.key === 'Enter') {

                                        e.preventDefault()

                                        send()
                                    }

                                }}
                                className='min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600'
                                type='text'
                                placeholder='Message your team or AI...'
                            />


                            <button
                                onClick={send}
                                disabled={!message.trim()}
                                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30'
                            >

                                <i className='ri-arrow-up-line'></i>

                            </button>

                        </div>


                        <p className='mt-1.5 px-1 text-[10px] text-neutral-700'>

                            Press Enter to send

                        </p>

                    </div>

                </div>


                {/* =================================================
                    COLLABORATORS SIDE PANEL
                ================================================= */}

                <div
                    className={`
                        absolute inset-0 z-30 flex flex-col bg-[#0d0d0d]
                        transition-transform duration-300 ease-out
                        ${isSidePanelOpen
                            ? 'translate-x-0'
                            : '-translate-x-full'
                        }
                    `}
                >

                    <header className='flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#101010] px-4'>

                        <div>

                            <h2 className='text-sm font-semibold text-neutral-100'>

                                Collaborators

                            </h2>


                            <p className='text-[11px] text-neutral-600'>

                                {project?.users?.length || 0}{' '}

                                {project?.users?.length === 1
                                    ? 'person'
                                    : 'people'}{' '}

                                in this project

                            </p>

                        </div>


                        <button
                            onClick={() =>
                                setIsSidePanelOpen(
                                    !isSidePanelOpen
                                )
                            }
                            className='flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-100'
                        >

                            <i className='ri-close-line'></i>

                        </button>

                    </header>


                    <div className='flex-1 overflow-auto p-3'>

                        {(!project?.users ||
                            project.users.length === 0) && (

                                <div className='flex h-full flex-col items-center justify-center text-center'>

                                    <div className='mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-neutral-600'>

                                        <i className='ri-group-line'></i>

                                    </div>


                                    <p className='text-sm text-neutral-400'>

                                        No collaborators yet

                                    </p>

                                </div>

                            )}


                        <div className='space-y-1'>

                            {project?.users?.map(
                                (projectUser, index) => {

                                    const email =
                                        getUserEmail(
                                            projectUser
                                        )

                                    return (

                                        <div
                                            key={
                                                getUserId(
                                                    projectUser
                                                ) || index
                                            }
                                            className='flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-neutral-900'
                                        >

                                            <div className='relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white'>

                                                <span className='text-xs font-semibold'>

                                                    {getUserInitial(
                                                        projectUser
                                                    )}

                                                </span>


                                                <span className='absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0d0d0d] bg-emerald-500'></span>

                                            </div>


                                            <div className='min-w-0 flex-1'>

                                                <p className='truncate text-sm font-medium text-neutral-200'>

                                                    {email}

                                                </p>


                                                <p className='text-[10px] text-emerald-500'>

                                                    Collaborator

                                                </p>

                                            </div>

                                        </div>

                                    )

                                }
                            )}

                        </div>

                    </div>

                </div>

            </section>


            {/* =====================================================
                IDE
            ===================================================== */}

            <section className='flex h-[48vh] min-h-0 flex-1 bg-[#080808] lg:h-screen'>


                {/* File Explorer */}

                <div className='hidden h-full w-56 shrink-0 border-r border-neutral-800 bg-[#0d0d0d] md:block'>

                    <div className='flex h-14 items-center border-b border-neutral-800 px-4'>

                        <div className='flex items-center gap-2'>

                            <i className='ri-folder-3-line text-sm text-neutral-500'></i>

                            <span className='text-[11px] font-semibold uppercase tracking-wider text-neutral-500'>

                                Explorer

                            </span>

                        </div>

                    </div>


                    <div className='overflow-auto p-2'>

                        {Object.keys(fileTree).length === 0 && (

                            <div className='px-3 py-8 text-center'>

                                <i className='ri-file-code-line text-xl text-neutral-700'></i>

                                <p className='mt-2 text-xs text-neutral-600'>

                                    No files available

                                </p>

                            </div>

                        )}


                        <div className='space-y-0.5'>

                            {Object.keys(fileTree).map(
                                (file, index) => (

                                    <button
                                        key={index}
                                        onClick={() => {

                                            setCurrentFile(file)

                                            setOpenFiles([
                                                ...new Set([
                                                    ...openFiles,
                                                    file
                                                ])
                                            ])

                                        }}
                                        className={`
                                            group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-all
                                            ${currentFile === file
                                                ? 'bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/10'
                                                : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
                                            }
                                        `}
                                    >

                                        <i
                                            className={`
                                                ri-file-code-line text-sm
                                                ${currentFile === file
                                                    ? 'text-blue-400'
                                                    : 'text-neutral-700'
                                                }
                                            `}
                                        ></i>


                                        <p className='truncate font-medium'>

                                            {file}

                                        </p>

                                    </button>

                                )
                            )}

                        </div>

                    </div>

                </div>


                {/* Code Editor */}

                <div className='flex min-w-0 flex-1 flex-col'>


                    {/* Editor Top Bar */}

                    <div className='flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 bg-[#101010]'>


                        <div className='flex min-w-0 flex-1 overflow-x-auto'>

                            {openFiles.length === 0 && (

                                <div className='flex items-center px-4 text-xs text-neutral-700'>

                                    No file open

                                </div>

                            )}


                            {openFiles.map((file, index) => (

                                <button
                                    key={index}
                                    onClick={() =>
                                        setCurrentFile(file)
                                    }
                                    className={`
                                        group flex max-w-48 shrink-0 items-center gap-2 border-r border-neutral-800 px-3.5 text-xs transition-colors
                                        ${currentFile === file
                                            ? 'bg-[#080808] text-neutral-100'
                                            : 'text-neutral-600 hover:bg-neutral-900 hover:text-neutral-300'
                                        }
                                    `}
                                >

                                    <i className='ri-file-code-line text-xs'></i>

                                    <span className='truncate'>

                                        {file}

                                    </span>

                                </button>

                            ))}

                        </div>


                        {/* Run */}

                        <div className='flex shrink-0 items-center gap-2 px-3'>

                            <button
                                onClick={async () => {

                                    await webContainer.mount(
                                        fileTree
                                    )


                                    const installProcess =
                                        await webContainer.spawn(
                                            "npm",
                                            ["install"]
                                        )


                                    installProcess.output.pipeTo(
                                        new WritableStream({

                                            write(chunk) {

                                                console.log(
                                                    chunk
                                                )

                                            }

                                        })
                                    )


                                    if (runProcess) {
                                        runProcess.kill()
                                    }


                                    let tempRunProcess =
                                        await webContainer.spawn(
                                            "npm",
                                            ["start"]
                                        )


                                    tempRunProcess.output.pipeTo(
                                        new WritableStream({

                                            write(chunk) {

                                                console.log(
                                                    chunk
                                                )

                                            }

                                        })
                                    )


                                    setRunProcess(
                                        tempRunProcess
                                    )


                                    webContainer.on(
                                        'server-ready',
                                        (port, url) => {

                                            console.log(
                                                port,
                                                url
                                            )

                                            setIframeUrl(
                                                url
                                            )

                                        }
                                    )

                                }}
                                className='flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-500 active:scale-[0.98]'
                            >

                                <i className='ri-play-fill'></i>

                                Run

                            </button>

                        </div>

                    </div>


                    {/* Editor Area */}

                    <div className='min-h-0 flex-1 overflow-auto'>

                        {fileTree[currentFile] ? (

                            <div className='code-editor-area h-full overflow-auto bg-[#080808]'>

                                <pre className='hljs m-0 min-h-full'>

                                    <code
                                        className='hljs block min-h-full outline-none'
                                        contentEditable
                                        suppressContentEditableWarning

                                        onBlur={(e) => {

                                            const updatedContent =
                                                e.target.innerText


                                            const ft = {

                                                ...fileTree,

                                                [currentFile]: {

                                                    file: {

                                                        contents:
                                                            updatedContent

                                                    }

                                                }

                                            }


                                            setFileTree(ft)

                                            saveFileTree(ft)

                                        }}

                                        dangerouslySetInnerHTML={{
                                            __html:
                                                hljs.highlight(
                                                    'javascript',
                                                    fileTree[
                                                        currentFile
                                                    ].file.contents
                                                ).value
                                        }}

                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            paddingBottom: '25rem',
                                            counterSet:
                                                'line-numbering',
                                        }}

                                    />

                                </pre>

                            </div>

                        ) : (

                            <div className='flex h-full flex-col items-center justify-center bg-[#080808] px-6 text-center'>

                                <div className='mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-700'>

                                    <i className='ri-code-s-slash-line text-2xl'></i>

                                </div>


                                <h2 className='text-sm font-medium text-neutral-400'>

                                    No file selected

                                </h2>


                                <p className='mt-1 max-w-xs text-xs leading-5 text-neutral-700'>

                                    Select a file from the Explorer to start editing.

                                </p>

                            </div>

                        )}

                    </div>

                </div>


                {/* Preview */}

                {iframeUrl && webContainer && (

                    <div className='hidden h-full w-[30rem] shrink-0 flex-col border-l border-neutral-800 bg-[#0d0d0d] xl:flex'>

                        <div className='flex h-14 items-center gap-2 border-b border-neutral-800 px-3'>

                            <div className='flex items-center gap-1.5'>

                                <span className='h-2.5 w-2.5 rounded-full bg-red-500/70'></span>

                                <span className='h-2.5 w-2.5 rounded-full bg-yellow-500/70'></span>

                                <span className='h-2.5 w-2.5 rounded-full bg-green-500/70'></span>

                            </div>


                            <input
                                type='text'
                                onChange={(e) =>
                                    setIframeUrl(
                                        e.target.value
                                    )
                                }
                                value={iframeUrl}
                                className='min-w-0 flex-1 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-400 outline-none focus:border-neutral-700'
                            />


                            <button
                                onClick={() =>
                                    setIframeUrl(
                                        iframeUrl
                                    )
                                }
                                className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-800 hover:text-neutral-300'
                            >

                                <i className='ri-refresh-line'></i>

                            </button>

                        </div>


                        <div className='min-h-0 flex-1 bg-white'>

                            <iframe
                                src={iframeUrl}
                                className='h-full w-full border-0'
                                title='Project Preview'
                            />

                        </div>

                    </div>

                )}

            </section>


            {/* =====================================================
                ADD COLLABORATOR MODAL
            ===================================================== */}

            {isModalOpen && (

                <div
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'
                    onClick={() =>
                        setIsModalOpen(false)
                    }
                >

                    <div
                        className='relative flex max-h-[min(650px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#111111] shadow-2xl shadow-black/60'
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >


                        {/* Header */}

                        <header className='flex shrink-0 items-center justify-between border-b border-neutral-800 px-5 py-4'>

                            <div className='flex items-center gap-3'>

                                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20'>

                                    <i className='ri-user-add-line text-lg'></i>

                                </div>


                                <div>

                                    <h2 className='text-sm font-semibold text-neutral-100'>

                                        Add collaborators

                                    </h2>


                                    <p className='mt-0.5 text-[11px] text-neutral-600'>

                                        Select people to invite

                                    </p>

                                </div>

                            </div>


                            <button
                                onClick={() =>
                                    setIsModalOpen(false)
                                }
                                className='flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-100'
                            >

                                <i className='ri-close-line text-lg'></i>

                            </button>

                        </header>


                        {/* Users */}

                        <div className='min-h-0 flex-1 overflow-auto p-3'>

                            {users.length === 0 && (

                                <div className='flex flex-col items-center justify-center py-12 text-center'>

                                    <i className='ri-user-search-line text-2xl text-neutral-700'></i>


                                    <p className='mt-3 text-sm text-neutral-500'>

                                        No users available

                                    </p>

                                </div>

                            )}


                            <div className='space-y-1'>

                                {users.map(user => {

                                    const isSelected =
                                        selectedUserId.has(
                                            user._id
                                        )


                                    return (

                                        <div
                                            key={user._id}
                                            onClick={() =>
                                                handleUserClick(
                                                    user._id
                                                )
                                            }
                                            className={`
                                                flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-all
                                                ${isSelected
                                                    ? 'border-blue-500/30 bg-blue-500/10'
                                                    : 'border-transparent hover:bg-neutral-900'
                                                }
                                            `}
                                        >

                                            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 text-xs font-semibold text-neutral-300'>

                                                {user.email
                                                    ?.charAt(0)
                                                    ?.toUpperCase()}

                                            </div>


                                            <div className='min-w-0 flex-1'>

                                                <p className='truncate text-sm font-medium text-neutral-200'>

                                                    {user.email}

                                                </p>


                                                <p className='text-[10px] text-neutral-600'>

                                                    Team member

                                                </p>

                                            </div>


                                            <div
                                                className={`
                                                    flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all
                                                    ${isSelected
                                                        ? 'border-blue-500 bg-blue-500 text-white'
                                                        : 'border-neutral-700 text-transparent'
                                                    }
                                                `}
                                            >

                                                <i className='ri-check-line text-xs'></i>

                                            </div>

                                        </div>

                                    )

                                })}

                            </div>

                        </div>


                        {/* Footer */}

                        <div className='flex shrink-0 items-center justify-between border-t border-neutral-800 bg-neutral-950/50 px-5 py-4'>

                            <span className='text-xs text-neutral-600'>

                                {selectedUserId.size}{' '}

                                {selectedUserId.size === 1
                                    ? 'person'
                                    : 'people'}{' '}

                                selected

                            </span>


                            <div className='flex gap-2'>

                                <button
                                    onClick={() =>
                                        setIsModalOpen(false)
                                    }
                                    className='rounded-lg border border-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200'
                                >

                                    Cancel

                                </button>


                                <button
                                    onClick={addCollaborators}
                                    disabled={
                                        selectedUserId.size === 0
                                    }
                                    className='rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40'
                                >

                                    Add collaborators

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </main>
    )
}


export default Project