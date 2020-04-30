import React from "react"
import { Edit, Delete, CheckCircleOutline, HighlightOff, Visibility } from "@material-ui/icons"

export default function ActionPanel(props) {
    const { row, editFn, deleteFn, setActive, viewFn } = props
    const pointerStyle = {
        cursor: 'pointer'
    }
    return (
        <>
            <Edit
                style={pointerStyle}
                onClick={editFn}
            />
            <Delete
                style={pointerStyle}
                onClick={deleteFn}
            />
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