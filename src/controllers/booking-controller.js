const {BookingService}=require('../services');
const {SuccessResponse,ErrorResponse}=require('../utils/common');
const {StatusCodes}=require('http-status-codes');
const inMemDb={};

async function createBooking(req,res){
    try{
        const response= await BookingService.createBooking({
           flightId:req.body.flightId,
           userId: req.body.userId,
           noOfSeats:req.body.noOfSeats
        });
        SuccessResponse.success.data=response;
        return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch(error){
        ErrorResponse.error.error=error;
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

async function makePayment(req,res){
    try{
        const idemptencyKey=req.headers['x-idempotency-key'];
        if(inMemDb[idemptencyKey]){
            return res.status(StatusCodes.BAD_REQUEST).json({message:'can\'t retry on a succesful payment'});
        }
        if(!idemptencyKey){
            return res.status(StatusCodes.BAD_REQUEST).json({message:'Idempotency key missing'});
        }
        const response= await BookingService.makePayment({
           totalCost:req.body.totalCost,
           userId: req.body.userId,
           bookingId:req.body.bookingId
        });
        inMemDb[idemptencyKey]=idemptencyKey;
        SuccessResponse.success.data=response;
        return res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch(error){
        ErrorResponse.error.error=error;
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    }
}

module.exports={
    createBooking,
    makePayment
}