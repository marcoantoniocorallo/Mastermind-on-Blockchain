import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row'; 
import { contract, getCode, getGame } from "./utils";

async function submitFeedback(CC, NC){
    console.debug("Submitting feedback:",CC,NC);

    try{
        const tx = await contract.sendFeedback(CC, NC, getGame());
        const receipt = await tx.wait();
        console.debug(receipt);
    } catch(err){
        if (err.code === 'INVALID_ARGUMENT')             alert("Invalid Feedback.");
        else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') alert(err.error.message.substring(20));
        console.log("Catched: ", err);
    }
}

export default function Feedback(){
    return (
    <Form style={{ padding: "20px", position:"absolute", top:"50%", left:"5%" }}>
      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridCC">
          <Form.Label>CC</Form.Label>
          <Form.Control type="number" required style={{width: 100 }} id="CC_text"/>
        </Form.Group>

        <Form.Group as={Col} controlId="formGridNC">
          <Form.Label>NC</Form.Label>
          <Form.Control type="number" required style={{width: 100 }} id="NC_text"/>
        </Form.Group>
      </Row>
      <Button variant="secondary" id="fbbutton"
      onClick={
        () => submitFeedback(
          document.getElementById('CC_text').value, 
          document.getElementById('NC_text').value
        )}>
        Submit
      </Button>
    </Form>
    
    );
}