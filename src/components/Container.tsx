import React, { useContext, useState, useRef, useEffect } from 'react'
import GlobalContext from './../context/Global'
import StoriesContext from './../context/Stories'
import ProgressContext from './../context/Progress'
import Story from './Story'
import ProgressArray from './ProgressArray'
import { GlobalCtx, StoriesContext as StoriesContextInterface } from './../interfaces'

export default function () {
    const [currentId, setCurrentId] = useState<number>(0)
    const [pause, setPause] = useState<boolean>(true)
    const [bufferAction, setBufferAction] = useState<boolean>(true)
    const [videoDuration, setVideoDuration] = useState<number>(0)
    const [clickDownTime, setClickDownTime] = useState<number>(-1);
    let mousedownId = useRef<any>();
    let isMounted = useRef<boolean>(true);

    const { width, height, loop, currentIndex, isPaused, keyboardNavigation, preventDefault, storyContainerStyles = {}, onNextStoriesSegment, onPreviousStoriesSegment  } = useContext<GlobalCtx>(GlobalContext);
    const { stories } = useContext<StoriesContextInterface>(StoriesContext);

    useEffect(() => {
        if (typeof currentIndex === 'number') {
            if (currentIndex >= 0 && currentIndex < stories.length) {
                setCurrentIdWrapper(() => currentIndex)
            } else {
                console.error('Index out of bounds. Current index was set to value more than the length of stories array.', currentIndex)
            }
        }
    }, [currentIndex])

    useEffect(() => {
        if (typeof isPaused === 'boolean') {
            setPause(isPaused)
        }
    }, [isPaused])

    useEffect(() => {
        const isClient = (typeof window !== 'undefined' && window.document);
        if (isClient && (typeof keyboardNavigation === 'boolean' && keyboardNavigation)) {
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            }
        }
    }, [keyboardNavigation]);

    // Cleanup mounted state - for issue #130 (https://github.com/mohitk05/react-insta-stories/issues/130)
    useEffect(() => {
        return () => {
            isMounted.current = false;
        }
    }, []);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            previous()
        }
        else if (e.key === 'ArrowRight') {
            next()
        }
    }

    const toggleState = (action: string, bufferAction?: boolean) => {
        setPause(isPaused || action === 'pause')
        setBufferAction(!!bufferAction)
    }

    const setCurrentIdWrapper = (callback) => {
        setCurrentId(callback);
        toggleState('pause', true);
    }

    const previous = () => {
        if(currentId > 0)
            setCurrentIdWrapper(prev => prev > 0 ? prev - 1 : prev)
        else if(onPreviousStoriesSegment) {
            onPreviousStoriesSegment();
            toggleState('pause', true);
        }
    }

    const next = () => {
        if (isMounted.current) {
            if (loop) {
                updateNextStoryIdForLoop()
            } else {
                updateNextStoryId()
            }
        }
    };

    const updateNextStoryIdForLoop = () => {
        setCurrentIdWrapper(prev => (prev + 1) % stories.length)
    }

    const updateNextStoryId = () => {
        if(currentId > 0) {
            setCurrentIdWrapper(prev => {
                if (prev < stories.length - 1) return prev + 1
                return prev
            })
        }
        else if(onNextStoriesSegment) onNextStoriesSegment()
    }

    const debouncePause = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        setClickDownTime((new Date).getTime())
        mousedownId.current = setTimeout(() => {
            toggleState('pause')
        }, 200)
    }

    const mouseUp = (type: string) => (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        mousedownId.current && clearTimeout(mousedownId.current)
        if (pause) {
            toggleState('play')
        } else if((new Date).getTime() - clickDownTime >= 5) {
            type === 'next' ? next() : previous()
        }
    }

    const getVideoDuration = (duration: number) => {
        setVideoDuration(duration * 1000)
    }

    return (
        <div style={{ ...styles.container, ...storyContainerStyles, ...{ width, height } }}>
            <ProgressContext.Provider value={{
                bufferAction: bufferAction,
                videoDuration: videoDuration,
                currentId,
                pause,
                next
            }}>
                <ProgressArray />
            </ProgressContext.Provider>
            <Story
                action={toggleState}
                bufferAction={bufferAction}
                playState={pause}
                story={stories[currentId]}
                getVideoDuration={getVideoDuration}
            />
            {!preventDefault && <div style={styles.overlay}>
              <div style={{ width: '50%', zIndex: 999 }} onTouchStart={debouncePause} onTouchEnd={mouseUp('previous')} onMouseDown={debouncePause} onMouseUp={mouseUp('previous')} />
              <div style={{ width: '50%', zIndex: 999 }} onTouchStart={debouncePause} onTouchEnd={mouseUp('next')} onMouseDown={debouncePause} onMouseUp={mouseUp('next')} />
            </div>}
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        background: '#111',
        position: 'relative'
    },
    overlay: {
        position: 'absolute',
        height: 'inherit',
        width: 'inherit',
        display: 'flex'
    }
}
