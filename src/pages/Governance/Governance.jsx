import React from "react";
import MenuItem from "../../components/MenuItem";
import { useHoverEffect } from "../../functions/useHoverEffect";

import "./Governance.css";
import BackButton from "../../components/BackButton/BackButton";

export default function Governance() {
    const {buttonsVisible, setButtonsVisible, buttonFlex, setButtonFlex} = useHoverEffect();
    return (
        <main className="container-home">

            {/* Radial menu section */}
            <div className="theCircle-home">
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                position: 'absolute',
                top: -120,
            }}>
                <BackButton to="/" title="Governance"/>
            </div>
                <img src="/RadiantGlow.png" alt="Radiant Glow" id="radiantGlow-home" />
    
                {/* Core element with hover effects */}
                <div
                    id="core-home"
                    role="button"
                    tabIndex={0}
                    aria-label="Show governance navigation"
                    aria-expanded={buttonsVisible}
                    onMouseEnter={() => {
                    setButtonFlex(true);
                    setButtonsVisible(true);
                    }}
                    onMouseLeave={() => {
                    setButtonsVisible(false);
                    }}
                    onFocus={() => {
                    setButtonFlex(true);
                    setButtonsVisible(true);
                    }}
                    onClick={() => {
                    setButtonFlex(true);
                    setButtonsVisible(true);
                    }}
                    onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setButtonFlex(true);
                        setButtonsVisible(true);
                    } else if (event.key === "Escape") {
                        setButtonsVisible(false);
                    }
                    }}
                >
                    <img src="/core.svg" alt="The Core" className="core-image" />
                    <img
                    src="/core-hovered2.svg"
                    alt="The Core Hovered"
                    className="core-image core-hovered-image"
                    />
                </div>

                {/* Top button with hover functionality */}
                <MenuItem
                    to="/dao"
                    id="buttonTop-home"
                    buttonsVisible={buttonsVisible}
                    buttonFlex={buttonFlex}
                    onMouseEnter={() => setButtonsVisible(true)} // Show buttons on hover
                    onMouseLeave={() => setButtonsVisible(false)} // Hide buttons on hover out
                    imgSrc="/radial-button.svg"
                    iconSrc="/dao.svg"
                    text="DAO"
                />
    
                {/* Left button with hover functionality */}
                <MenuItem
                    to="/skill-oracles"
                    id="buttonOracle-home"
                    buttonsVisible={buttonsVisible}
                    buttonFlex={buttonFlex}
                    onMouseEnter={() => setButtonsVisible(true)} // Show buttons on hover
                    onMouseLeave={() => setButtonsVisible(false)} // Hide buttons on hover out
                    imgSrc="/radial-button.svg"
                    iconSrc="/skillOracles.svg"
                    text="Skill Oracles"
                />
        
        
                {/* Right button with hover functionality */}
                <MenuItem
                    to="/about"
                    id="buttonToken-home"
                    buttonsVisible={buttonsVisible}
                    buttonFlex={buttonFlex}
                    onMouseEnter={() => setButtonsVisible(true)}
                    onMouseLeave={() => setButtonsVisible(false)}
                    imgSrc='/radial-button.svg'
                    iconSrc='/OWToken.svg'
                    text='About' 
                />
        
                {/* Hover text prompting user to hover over the radial menu */}
                <div
                    id="hoverText-home"
                    style={{ display: buttonFlex ? "none" : "flex" }}
                >
                    Hover to get started
                </div>
            </div>
        </main>  
    )
}
