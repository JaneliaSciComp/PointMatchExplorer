import React from "react"
import chroma from "chroma-js"

export const PMStrengthGradient = (props) => {
  var PMConnectionStrengthChromaScale = chroma.scale(props.colorList).domain([props.dmin, props.dmax])
  return (
    <div className = "gradient">
      <PMStrengthGradientTitle gradientTitle={props.gradientTitle}/>
      <PMStrengthGradientBar gradient={PMConnectionStrengthChromaScale} numSteps={props.numSteps} dmin={props.dmin} dmax={props.dmax}/>
      <PMStrengthGradientDomainLabels dmin={props.dmin} dmax={props.dmax}/>
    </div>
  )
}

const PMStrengthGradientTitle = (props) => {
  return <span className="label"> {props.gradientTitle} </span>
}

const PMStrengthGradientBar = (props) => {
  let steps = []
  var gradient = props.gradient
  for (var i = 0; i < props.numSteps; i++){
    var bgColor = gradient(props.dmin + ((i/props.numSteps) * (props.dmax - props.dmin)))
    steps.push(<PMStrengthGradientStep key={i} stepColor={bgColor}/>)
  }
  return <div>{steps}</div>
}

const PMStrengthGradientStep = (props) => {
  var stepStyle = {
    backgroundColor: props.stepColor
  }
  return <span className="grad-step" style={stepStyle}></span>
}

const PMStrengthGradientDomainLabels = (props) => {
  var dmid = 0.5 * (props.dmin + props.dmax)
  return (
    <div>
      <span className="domain-min"> {props.dmin} </span>
      <span className="domain-med"> {dmid} </span>
      <span className="domain-max"> {props.dmax} </span>
    </div>
  )
}
