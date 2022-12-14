import React from 'react'
import { ProgressWrapperProps } from './../interfaces'

const ProgressWrapper = (props: ProgressWrapperProps) => (
    <div style={{ ...styles.progress, ...getProgressWrapperStyle(props) }}>
        {props.children}
    </div>
)

const getProgressWrapperStyle = ({ width, pause, bufferAction }) => ({
    width: `${width * 100}%`,
    opacity: pause && !bufferAction ? 0 : 1
})

const styles = {
    progress: {
        height: 8,
        maxWidth: '100%',
        background: 'rgba(255, 255, 255, 0.32)',
        margin: 2,
        borderRadius: 2,
        transition: 'opacity 400ms ease-in-out',
        boxShadow: 'none',
        filter: 'none'
    }
}

export default ProgressWrapper
