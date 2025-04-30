import {React, useState} from "react";
import StatusButton from "../StatusButton/StatusButton";

import './Milestone.css';
import Button from "../Button/Button";

export default function Milestone({title, status, amount, date, content, editable}) {
    const [open, setOpen] = useState(false);
    const [edit, setEdit] = useState(false)
    return (
        <>
            <div className="milestone">
                <div className="milestone-header" onClick={() => {setOpen(!open)}}>
                    <div className="milestone-header-content">
                        <div className="milestone-title">
                            <span>{title}</span>
                            {status && <StatusButton status={status}/>}
                        </div>
                        <div className="milestone-amount">
                            <span>{amount}</span>
                            <img src="/xdc.svg" alt="" />
                            {date && <>
                            <span>•</span>
                            <span style={{fontSize:'14px', color:'#868686'}}>{date}</span>
                            </>}
                        </div>
                    </div>
                    <div className="arrow-icon">
                        <img src={`/${open?'arrayup.svg':'array.svg'}`} alt="" width={10} height={5}/>
                    </div>
                </div>
                {open && 
                    (<div className="milestone-body">
                        <div className="milestone-body-line"/>
                        <div className="milestone-body-content">{content}</div>
                        {editable && (
                            <>
                                <div className="milestone-body-line"/>
                                <div className="edit-content">
                                    <Button label="Edit" buttonCss='editButton' icon='/edit.svg' onClick={()=>setEdit(true)}/>
                                    <Button buttonCss='editButton' icon='/delete.svg'/>
                                </div>
                            </>
                        )}
                    </div>)
                }
            </div>
            {edit && <div className="milestone" style={{display:'flex', flexDirection:'column', gap:18}}>
                <div className="profile-item">
                    <span>{title}</span>
                </div>
                <div>
                    <textarea
                    placeholder="Dispute Explanation"
                    value={content}
                ></textarea>
                </div>
                <div className="amountDC">
                    <input
                        id="amountInput"
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={amount}
                    />
                </div>
                <div className="lineDC"></div>
                <div style={{display: 'flex', alignItems:'center', gap:12, justifyContent:"flex-end"}}>
                    <Button label={'Cancel'} buttonCss={'editButton'} onClick={() => {setEdit(false)}}/>
                    <Button label={'Save'} buttonCss={'editButton'} />
                </div>
            </div>}
        </>
    )
}