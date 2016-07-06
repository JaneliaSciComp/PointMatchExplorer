var PMStrengthGradient = React.createClass({
  generateGradient : function(){
    var PMConnectionStrengthChromaScale = chroma.scale(this.props.colorList).domain([this.props.dmin, this.props.dmax])
    return PMConnectionStrengthChromaScale;
  },
  render: function(){
    return (
      <div className = "gradient">
        <PMStrengthGradientTitle gradientTitle={this.props.gradientTitle}/>
        <PMStrengthGradientBar gradient={this.generateGradient()} numSteps={this.props.numSteps} dmin={this.props.dmin} dmax={this.props.dmax}/>
        <PMStrengthGradientDomainLabels dmin={this.props.dmin} dmax={this.props.dmax}/>
      </div>
    );
  }
});

var PMStrengthGradientTitle = React.createClass({
  render: function(){
    return <span className="label"> {this.props.gradientTitle} </span>;
  }
});

var PMStrengthGradientBar = React.createClass({
  render: function(){
    var steps = [];
    var gradient = this.props.gradient;
    for (var i = 0; i < this.props.numSteps; i++){
      var bgColor = gradient(this.props.dmin + ((i/this.props.numSteps) * (this.props.dmax - this.props.dmin)))
      steps.push(<PMStrengthGradientStep key={i} stepColor={bgColor}/>)
    }
    return <div>{steps}</div>;
  }
});

var PMStrengthGradientStep = React.createClass({
  render: function(){
    var stepStyle = {
      backgroundColor: this.props.stepColor
    };
    return <span className="grad-step" style={stepStyle}></span>;
  }
});

var PMStrengthGradientDomainLabels = React.createClass({
  render: function(){
    var dmid = 0.5 * (this.props.dmin + this.props.dmax);
    return (
      <div>
        <span className="domain-min"> {this.props.dmin} </span>
        <span className="domain-med"> {dmid} </span>
        <span className="domain-max"> {this.props.dmax} </span>
      </div>
    );
  }
});

var MetadataInfo = React.createClass({
  render: function(){
    return <MetadataKVPairs kvpairs={this.props.kvpairs}/>
  }
});

var MetadataKVPairs = React.createClass({
  render: function(){
    var kvpairs = [];
    for (var i = 0; i < this.props.kvpairs.length; i++){
      kvpairs.push(<KVPair key={i} keyname={this.props.kvpairs[i].keyname} valuename={this.props.kvpairs[i].valuename}/>)
    }
    return <div>{kvpairs}</div>;
  }
});

var KVPair = React.createClass({
  render: function(){
    return <div> {this.props.keyname + ": " + this.props.valuename} </div>
  }
});

var dmin = 1;
var dmax = 100;
var numSteps = 20;
var colorList = ['#c33f2e', '#fc9d59', '#fee08b', '#e0f381', '#76c76f', '#3288bd'];
var gradientTitle = "Point Match Strength"

ReactDOM.render(
  <PMStrengthGradient gradientTitle={gradientTitle} colorList={colorList} numSteps={numSteps} dmin={dmin} dmax= {dmax} />,
  document.getElementById('gradientContainer')
);

var kvpairs = [{keyname: "key1",valuename: "value1"}, {keyname: "key2",valuename: "value2"}]

ReactDOM.render(
  <MetadataInfo kvpairs={kvpairs}/>,
  document.getElementById('metadata')
);
