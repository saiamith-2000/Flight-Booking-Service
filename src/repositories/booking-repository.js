const {StatusCodes}=require('http-status-codes');
const {Booking_Status}=require('../utils/common/enums');
const {CANCELLED,BOOKED,PENDING,INITIATED}=Booking_Status;
const {Booking}=require('../models');
const CRUDRepository=require('./crud-repository');
const {Op}=require('sequelize');

class BookingRepository extends CRUDRepository{
    constructor(){
        super(Booking);
    }

    async createBooking(data,transaction){
        const response=await Booking.create(data,{transaction:transaction});
        return response;
    }
    async get(data,transaction){
        const response=await Booking.findByPk(data,{transaction:transaction});
        if(!response){
            throw new AppError('Not able to locate the resource',StatusCodes.NOT_FOUND);
        }
        return response;
    }
    async update(id,data,transaction){
        const response=await Booking.update(data, {
            where: {
                id
            }
        },{transaction:transaction});
        if(!response){
            throw new AppError('Not able to locate the resource',StatusCodes.NOT_FOUND);
        }
        return response;
    }

    async cancelOldBookings(timestamp){
        console.log("in repo");
        const response=await Booking.update({status:CANCELLED},{
            where:{
                [Op.and]:[{
                status:{
                   [Op.ne]: BOOKED
                },
                status:{
                    [Op.ne]: CANCELLED
                 },
                },
                {
                createdAt:{
                    [Op.lt]: timestamp
                }
                }
            ]
        }
        });
        return response;
    }
}

module.exports=BookingRepository;