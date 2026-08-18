import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { disconnectSocket, initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'; 
import 'highlight.js/styles/github-dark.css'
import { getWebContainer } from '../config/webcontainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-')) {
            hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()
    const { user } = useContext(UserContext)
    const navigate = useNavigate()
    const projectId = location.state?.project?._id

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set())
    const [ project, setProject ] = useState(location.state?.project || null)
    const [ message, setMessage ] = useState('')
    const messageBox = useRef(null)

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) // New state variable for messages
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }


    function addCollaborators() {
        if (!projectId) return

        axios.put("/projects/add-user", {
            projectId,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setProject(res.data.project || project)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    const send = () => {
        const trimmedMessage = message.trim()
        if (!trimmedMessage) return

        sendMessage('project-message', {
            message: trimmedMessage,
            sender: user
        })
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message: trimmedMessage } ])
        setMessage("")

    }

    function WriteAiMessage(message) {

        let messageObject

        try {
            messageObject = typeof message === 'string' ? JSON.parse(message) : message
        } catch {
            return <p className='whitespace-pre-wrap text-sm'>{String(message)}</p>
        }

        return (
            <div
                className='overflow-auto rounded-md border border-neutral-700 bg-neutral-950 p-3 text-neutral-100'
            >
                <Markdown
                    children={messageObject?.text || ''}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {
        if (!projectId) {
            navigate('/')
            return
        }

        initializeSocket(projectId)

        getWebContainer().then(container => {
            setWebContainer(container)
            console.log('container started')
        }).catch(err => console.error(err))

        const cleanupMessageListener = receiveMessage('project-message', data => {
            console.log(data)

            if (data.sender?._id === 'ai') {
                let aiMessage = null

                try {
                    aiMessage = typeof data.message === 'string' ? JSON.parse(data.message) : data.message
                } catch {
                    aiMessage = null
                }

                if (aiMessage?.fileTree) {
                    setFileTree(aiMessage.fileTree || {})
                }
                setMessages(prevMessages => [ ...prevMessages, data ])
            } else {
                setMessages(prevMessages => [ ...prevMessages, data ])
            }
        })

        axios.get(`/projects/get-project/${projectId}`).then(res => {
            console.log(res.data)
            setProject(res.data)
            setFileTree(res.data.fileTree || {})
        }).catch(err => {
            console.log(err)
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users || [])
        }).catch(err => {
            console.log(err)
        })

        return () => {
            if (cleanupMessageListener) {
                cleanupMessageListener()
            }
            disconnectSocket()
        }
    }, [projectId, navigate])

    useEffect(() => {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
    }, [messages])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }



    return (
        <main className='h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 lg:flex'>
            <section className="left relative flex h-[52vh] min-w-0 flex-col border-b border-neutral-800 bg-neutral-900 lg:h-screen lg:w-[26rem] lg:border-b-0 lg:border-r">
                <header className='absolute top-0 z-10 flex w-full items-center justify-between border-b border-neutral-800 bg-neutral-900/95 p-3 px-4 backdrop-blur'>
                    <button className='btn btn-secondary flex items-center gap-2 !py-1.5 text-sm' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill mr-1"></i>
                        <p>Add collaborator</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='btn btn-secondary !p-2'>
                        <i className="ri-group-fill"></i>
                    </button>
                </header>
                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">

                    <div
                        ref={messageBox}
                        className="message-box flex max-h-full flex-grow flex-col gap-2 overflow-auto p-3 scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender?._id === 'ai' ? 'max-w-[30rem]' : 'max-w-80'} ${msg.sender?._id == user?._id?.toString() && 'ml-auto bg-blue-700'} message flex w-fit flex-col rounded-lg border border-neutral-700 bg-neutral-800 p-2.5`}>
                                <small className='text-xs text-neutral-400'>{msg.sender?.email || 'Unknown'}</small>
                                <div className='text-sm text-neutral-100'>
                                    {msg.sender?._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    send()
                                }
                            }}
                            className='flex-grow border-t border-neutral-800 bg-neutral-900 p-3 px-4 text-neutral-100 outline-none placeholder:text-neutral-500' type="text" placeholder='Type your message...' />
                        <button
                            onClick={send}
                            className='btn btn-primary rounded-none border-l border-neutral-800 !px-5'><i className="ri-send-plane-fill"></i></button>
                    </div>
                </div>
                <div className={`sidePanel absolute top-0 flex h-full w-full flex-col gap-2 bg-neutral-900 transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <header className='flex items-center justify-between border-b border-neutral-800 bg-neutral-900 p-3 px-4'>

                        <h1
                            className='text-lg font-semibold'
                        >Collaborators</h1>

                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='btn btn-secondary !p-2'>
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2 p-2">

                        {project?.users?.map((projectUser, index) => (
                            <div key={projectUser._id || index} className="user flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-neutral-800">
                                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white'>
                                    <i className="ri-user-fill absolute"></i>
                                </div>
                                <h1 className='font-semibold text-neutral-100'>{projectUser.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="right flex h-[48vh] min-h-0 flex-grow bg-neutral-950 lg:h-screen">

                <div className="explorer hidden h-full min-w-52 max-w-64 border-r border-neutral-800 bg-neutral-900 md:block">
                    <div className="file-tree w-full">
                        {
                            Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentFile(file)
                                        setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                    }}
                                    className="tree-element flex w-full cursor-pointer items-center gap-2 border-b border-neutral-800 bg-neutral-900 p-2 px-4 text-left hover:bg-neutral-800">
                                    <p
                                        className='font-medium text-neutral-200'
                                    >{file}</p>
                                </button>))

                        }
                    </div>

                </div>


                <div className="code-editor flex flex-col flex-grow h-full shrink">

                    <div className="top flex w-full items-center justify-between border-b border-neutral-800 bg-neutral-900">

                        <div className="files flex overflow-x-auto">
                            {
                                openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`open-file flex w-fit cursor-pointer items-center gap-2 px-4 py-2 text-sm ${currentFile === file ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'}`}>
                                        <p
                                            className='font-medium'
                                        >{file}</p>
                                    </button>
                                ))
                            }
                        </div>

                        <div className="actions flex gap-2">
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree)


                                    const installProcess = await webContainer.spawn("npm", [ "install" ])



                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    if (runProcess) {
                                        runProcess.kill()
                                    }

                                    let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);

                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    setRunProcess(tempRunProcess)

                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url)
                                        setIframeUrl(url)
                                    })

                                }}
                                className='btn btn-success m-2 text-sm'
                            >
                                run
                            </button>


                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {
                            fileTree[ currentFile ] && (
                                <div className="code-editor-area h-full flex-grow overflow-auto bg-neutral-950">
                                    <pre
                                        className="hljs h-full">
                                        <code
                                            className="hljs h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[ currentFile ].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        />
                                    </pre>
                                </div>
                            )
                        }
                    </div>

                </div>

                {iframeUrl && webContainer &&
                    (<div className="hidden h-full min-w-96 flex-col border-l border-neutral-800 bg-neutral-900 xl:flex">
                        <div className="address-bar border-b border-neutral-800">
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} className="w-full bg-neutral-900 p-2 px-4 text-neutral-200 outline-none" />
                        </div>
                        <iframe src={iframeUrl} className="h-full w-full bg-white"></iframe>
                    </div>)
                }


            </section>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
                    <div className="relative w-96 max-w-full rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-neutral-100">
                        <header className='mb-4 flex items-center justify-between'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='btn btn-secondary !p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list mb-16 flex max-h-96 flex-col gap-2 overflow-auto">
                            {users.map(user => (
                                <div key={user._id} className={`user flex cursor-pointer items-center gap-2 rounded-md p-2 ${selectedUserId.has(user._id) ? 'bg-blue-700/30 border border-blue-700' : 'hover:bg-neutral-800'}`} onClick={() => handleUserClick(user._id)}>
                                    <div className='relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='btn btn-primary absolute bottom-4 left-1/2 -translate-x-1/2 transform'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project