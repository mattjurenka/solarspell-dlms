import React from "react"
import { Edit, Delete, CheckCircleOutline, HighlightOff, Visibility, ArrowBack, CropOriginal, FileCopy, Build, GetApp } from "@material-ui/icons"

interface ActionPanelProps {
    row?: any,
    editFn?: () => void,
    deleteFn?: () => void,
    setActive?: (is_active: boolean) => void
    viewFn?: () => void
    addFn?: () => void
    imageFn?: () => void
    cloneFn?: () => void
    buildFn?: () => void
    downloadFn?: () => void
}

export default function ActionPanel(props:ActionPanelProps) {
    const { row, editFn, deleteFn, setActive, viewFn, addFn, imageFn, cloneFn, buildFn, downloadFn } = props
    const pointerStyle = {
        cursor: 'pointer'
    }
    return (
        <>
            {addFn !== undefined ? (
                <ArrowBack
                    style={pointerStyle}
                    onClick={addFn}
                />
            ) : (
                <></>
            )}
            {editFn !== undefined ? (
                <Edit
                    style={pointerStyle}
                    onClick={editFn}
                />
            ) : (
                <></>
            )}
            {deleteFn !== undefined ? (
                <Delete
                    style={pointerStyle}
                    onClick={deleteFn}
                />
            ) : (
                <></>
            )}
            {setActive !== undefined ? (
                row.active == 0 ? (
                    <CheckCircleOutline
                        style={pointerStyle}
                        onClick={() => setActive(true)}
                    />
                ) : (
                    <HighlightOff
                        style={pointerStyle}
                        onClick={() => setActive(false)}
                    />
                )
            ) : (
               <></> 
            )}
            {viewFn !== undefined ? (
                <Visibility
                    style={pointerStyle}
                    onClick={viewFn}
                />
            ) : (
                <></>
            )}
            {imageFn !== undefined ? (
                <CropOriginal
                    style={pointerStyle}
                    onClick={imageFn}
                />
            ) : <></>}
            {cloneFn !== undefined ? (
                <FileCopy
                    style={pointerStyle}
                    onClick={cloneFn}
                />
            ) : <></>}
            {buildFn !== undefined ? (
                <Build
                    style={pointerStyle}
                    onClick={buildFn}
                />
            ) : <></>}
            {downloadFn !== undefined ? (
                <GetApp
                    style={pointerStyle}
                    onClick={downloadFn}
                />
            ) : <></>}
        </>
    )
}