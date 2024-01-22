const axios=require('axios');
const {BookingRepository}=require('../repositories');
const {Op}=require('sequelize');
const db=require('../models');
const {Booking_Status}=require('../utils/common/enums');
const {BOOKED,CANCELLED,INITIATED,PENDING}=Booking_Status;
const {ServerConfig,Queue}=require('../config');
const { AppError } = require('../utils/errors/app-error');
const { StatusCodes } = require('http-status-codes');

const bookingRepository=new BookingRepository();

async function createBooking(data){
    const transaction = await db.sequelize.transaction();
    try {
        const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}api/v1/flights/${data.flightId}`);  
        const totalAvailableSeats=flight.data.success.data.totalSeats;
        const seatPrice=flight.data.success.data.price;
        if(data.noOfSeats>totalAvailableSeats){throw new AppError('Available seats are not enough',StatusCodes.INTERNAL_SERVER_ERROR);}
        const totalBillingAmount=data.noOfSeats*seatPrice;
        const bookingPayload={...data,totalCost:totalBillingAmount};
        const booking =await bookingRepository.create(bookingPayload,transaction);
        const response=await axios.patch(`${ServerConfig.FLIGHT_SERVICE}api/v1/flights/${data.flightId}/seats`,{
            seats:data.noOfSeats,
            flightId:data.flightId
        });
        await transaction.commit();
        return booking;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function makePayment(data){
    const transaction = await db.sequelize.transaction();
    try {
        const bookingDetails=await bookingRepository.get(data.bookingId,transaction);
        if(bookingDetails.status===CANCELLED){
            throw new AppError('Booking has already been cancelled',StatusCodes.BAD_REQUEST);
        }
        const bookingTime=new Date(bookingDetails.createdAt);
        const current_time=new Date();
        if(current_time-bookingTime>900000){
            await cancelBooking(data.bookingId);
            await bookingRepository.update(data.bookingId,{status : CANCELLED},transaction);
            throw new AppError('Booking expired',StatusCodes.BAD_REQUEST);
        }
        if(bookingDetails.totalCost!=data.totalCost){
            throw new AppError('The payment doesn\'t match amount requested',StatusCodes.BAD_REQUEST);
        }
        if(bookingDetails.userId!=data.userId){
            throw new AppError('User corresponding to request doesn\'t match',StatusCodes.BAD_REQUEST);
        }
        const response=await bookingRepository.update(data.bookingId,{status : BOOKED},transaction);
        await transaction.commit();
        Queue.sendData({
            recipientEmail:'saiamith2000@gmail.com',
            subject:'Flight Booked',
            text:`Booking successfully done for flight ${data.bookingId}`
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function cancelBooking(bookingId){
    const transaction=await db.sequelize.transaction();
    try {
        const bookingDetails=await bookingRepository.get(bookingId,transaction);
        if(bookingDetails.status===CANCELLED){await transaction.commit();return true;}
        const response=await axios.patch(`${ServerConfig.FLIGHT_SERVICE}api/v1/flights/${bookingDetails.flightId}/seats`,{
            seats:bookingDetails.noOfSeats,
            flightId:bookingDetails.flightId,
            dec:false
        });
        await bookingRepository.update(bookingId,{status : CANCELLED},transaction);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}


async function cancelOldBookings(timestamp){
 try {
    const cut_off_time=Date.now() - 1000 * 300;
    const current_time=new Date(cut_off_time);
    const response=await bookingRepository.cancelOldBookings(current_time);
    return response;
 } catch (error) {
    console.log(error);
 }
}



module.exports={
  createBooking,
  makePayment,
  cancelOldBookings
}