import React from 'react'
import './Card.css'

function Card(props) {
    
    const handleClick = () => {
        if(props.onClick) {
            props.onClick();
        }
    }

    return(
        <div className='card-container' onClick={handleClick}>
            <div className='card-content'>
                <div>
                    <h2>{props.title}</h2>
                </div>
                <div>
                    <p>{props.descr}</p>
                </div>
            </div>
        </div>
    );
}

export default Card