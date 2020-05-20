import { DialogActions, DialogContent, Dialog, DialogTitle } from "@material-ui/core"
import React from 'react'

interface ActionDialogProps {
    title: string,
    open: boolean,
    actions: JSX.Element[],
    on_close?: () => void
}


const ActionDialog: React.SFC<ActionDialogProps> = (props) => {
    const on_close = props.on_close || (() => {})
    return (
        <Dialog
            open={props.open}
            onClose={on_close}
        >
            <DialogTitle>
                {props.title}
            </DialogTitle>
            <DialogContent>
                {props.children}
            </DialogContent>
            <DialogActions>
                {props.actions}
            </DialogActions>
        </Dialog>
    )
}

export default ActionDialog