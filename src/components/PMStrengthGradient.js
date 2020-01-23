import React from "react";
import chroma from "chroma-js";

export const PMStrengthGradient = (props) => {
  const PMConnectionStrengthChromaScale = chroma.scale(props.colorList).domain([props.dmin, props.dmax]);
  return (
    <div className = "gradient">
      <PMStrengthGradientTitle gradientTitle={props.gradientTitle}/>
      <PMStrengthGradientBar gradient={PMConnectionStrengthChromaScale} numSteps={props.numSteps} dmin={props.dmin} dmax={props.dmax}/>
      <PMStrengthGradientDomainLabels dmin={props.dmin} dmax={props.dmax}/>
    </div>
  );
};

const PMStrengthGradientTitle = (props) => {
  return <span className="title"> {props.gradientTitle} </span>;
};

const PMStrengthGradientBar = (props) => {
  let steps = [];
  const gradient = props.gradient;
  for (let i = 0; i < props.numSteps; i++){
    const bgColor = gradient(props.dmin + ((i / props.numSteps) * (props.dmax - props.dmin)));
    steps.push(<PMStrengthGradientStep key={i} stepColor={bgColor}/>);
  }
  return <div>{steps}</div>;
};

const PMStrengthGradientStep = (props) => {
  const stepStyle = {
    backgroundColor: props.stepColor
  };
  return <span className="grad-step" style={stepStyle}/>;
};

const PMStrengthGradientDomainLabels = (props) => {
  const dmid = 0.5 * (props.dmin + props.dmax);
  return (
    <div>
      <span className="domain-min"> {props.dmin} </span>
      <span className="domain-med"> {dmid} </span>
      <span className="domain-max"> {props.dmax} </span>
    </div>
  );
};
