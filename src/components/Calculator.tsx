import { useState } from "react";
import { Delete } from "lucide-react";

type Operator = "+" | "-" | "×" | "÷" | null;

const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const deleteLast = () => {
    if (display.length === 1 || (display.length === 2 && display.startsWith("-"))) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const toggleSign = () => {
    setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
  };

  const inputPercent = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const performOperation = (nextOperator: Operator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operator) {
      const currentValue = parseFloat(previousValue);
      let result: number;

      switch (operator) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "×":
          result = currentValue * inputValue;
          break;
        case "÷":
          result = currentValue / inputValue;
          break;
        default:
          result = inputValue;
      }

      const resultString = String(parseFloat(result.toFixed(10)));
      setDisplay(resultString);
      setPreviousValue(resultString);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = () => {
    if (!operator || previousValue === null) return;

    const inputValue = parseFloat(display);
    const currentValue = parseFloat(previousValue);
    let result: number;

    switch (operator) {
      case "+":
        result = currentValue + inputValue;
        break;
      case "-":
        result = currentValue - inputValue;
        break;
      case "×":
        result = currentValue * inputValue;
        break;
      case "÷":
        result = currentValue / inputValue;
        break;
      default:
        return;
    }

    const resultString = String(parseFloat(result.toFixed(10)));
    setDisplay(resultString);
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (value.endsWith(".")) return value;
    
    const parts = value.split(".");
    if (parts[0].length > 9) {
      return num.toExponential(4);
    }
    
    if (!value.includes(".")) {
      return num.toLocaleString("pt-BR");
    }
    
    const intPart = parseInt(parts[0]).toLocaleString("pt-BR");
    return intPart + "," + parts[1];
  };

  const getFontSize = () => {
    if (display.length > 12) return "text-3xl";
    if (display.length > 9) return "text-4xl";
    if (display.length > 6) return "text-5xl";
    return "text-6xl";
  };

  return (
    <div className="calc-container p-6 w-full max-w-sm mx-auto">
      {/* Display */}
      <div className="calc-display p-6 mb-6">
        <div className="text-right text-muted-foreground text-sm h-6 mb-2 font-medium tracking-wide">
          {previousValue && operator && (
            <span className="animate-in fade-in duration-300">
              {formatDisplay(previousValue)} {operator}
            </span>
          )}
        </div>
        <div 
          className={`text-right font-semibold tracking-tight transition-all duration-200 ${getFontSize()}`}
          style={{ color: "hsl(var(--calc-text))" }}
        >
          {formatDisplay(display)}
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Row 1 */}
        <button onClick={clear} className="calc-button-function h-16">
          AC
        </button>
        <button onClick={toggleSign} className="calc-button-function h-16">
          +/−
        </button>
        <button onClick={inputPercent} className="calc-button-function h-16">
          %
        </button>
        <button 
          onClick={() => performOperation("÷")} 
          className={`calc-button-operator h-16 ${operator === "÷" && waitingForOperand ? "active" : ""}`}
        >
          ÷
        </button>

        {/* Row 2 */}
        <button onClick={() => inputDigit("7")} className="calc-button-number h-16">
          7
        </button>
        <button onClick={() => inputDigit("8")} className="calc-button-number h-16">
          8
        </button>
        <button onClick={() => inputDigit("9")} className="calc-button-number h-16">
          9
        </button>
        <button 
          onClick={() => performOperation("×")} 
          className={`calc-button-operator h-16 ${operator === "×" && waitingForOperand ? "active" : ""}`}
        >
          ×
        </button>

        {/* Row 3 */}
        <button onClick={() => inputDigit("4")} className="calc-button-number h-16">
          4
        </button>
        <button onClick={() => inputDigit("5")} className="calc-button-number h-16">
          5
        </button>
        <button onClick={() => inputDigit("6")} className="calc-button-number h-16">
          6
        </button>
        <button 
          onClick={() => performOperation("-")} 
          className={`calc-button-operator h-16 ${operator === "-" && waitingForOperand ? "active" : ""}`}
        >
          −
        </button>

        {/* Row 4 */}
        <button onClick={() => inputDigit("1")} className="calc-button-number h-16">
          1
        </button>
        <button onClick={() => inputDigit("2")} className="calc-button-number h-16">
          2
        </button>
        <button onClick={() => inputDigit("3")} className="calc-button-number h-16">
          3
        </button>
        <button 
          onClick={() => performOperation("+")} 
          className={`calc-button-operator h-16 ${operator === "+" && waitingForOperand ? "active" : ""}`}
        >
          +
        </button>

        {/* Row 5 */}
        <button onClick={deleteLast} className="calc-button-function h-16">
          <Delete className="w-6 h-6 mx-auto" />
        </button>
        <button onClick={() => inputDigit("0")} className="calc-button-number h-16">
          0
        </button>
        <button onClick={inputDecimal} className="calc-button-number h-16">
          ,
        </button>
        <button onClick={calculate} className="calc-button-operator h-16">
          =
        </button>
      </div>
    </div>
  );
};

export default Calculator;
