import React from "react"
import { Edit, Delete, CheckCircleOutline, HighlightOff, Visibility, ArrowBack } from "@material-ui/icons"

interface ActionPanelProps {
    row?: any,
    editFn?: () => void,
    deleteFn?: () => void,
    setActive?: (is_active: boolean) => void
    viewFn?: () => void
    addFn?: () => void
}

export default function ActionPanel(props:ActionPanelProps) {
    const { row, editFn, deleteFn, setActive, viewFn, addFn } = props
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
                    onClick={() => viewFn()}
                />
            ) : (
                <></>
            )}
        </>
    )
}