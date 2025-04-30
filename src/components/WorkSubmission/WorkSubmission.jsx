import React from "react";
import './WorkSubmission.css';
import { useState } from "react";

export default function WorkSubmission({title, date, content}) {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <div className={`work-submission-header ${!open && "header-close"}`} onClick={() => {
                setOpen(!open);
            }}>
                <div className="submission-title">
                    <span>{title}</span>
                    <span className="date">{date}</span>
                </div>
                <img src={open ? `/arrayup.svg` : `/array.svg`} alt="arry" />
            </div>
            {open && (<div className="work-submission-body">
                <img src="/work.png" alt="" />
                <div className="submission-content">
                    {content}
                </div>
            </div>)}
        </div>
    )
}