const {User} = require('../models');
const {AuthenticationError} = require('apollo-server-express');
const {signToken} = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({_id: context.user._id})
                    .select('-__v -password');
                
                return userData;
            }
            console.log(context.User);
            throw new AuthenticationError('Not logged in');
        },

        users: async () => {
            return User.find()
                .select('-__v -password')
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return{token, user};
        },

        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if(!user){
                throw new AuthenticationError('Incorrect Credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw){
                throw new AuthenticationError('Incorrect Credentials')
            }

            const token = signToken(user);

            return {token, user};
        },

        saveBook: async (parent, args, context) => {
            if(context.user){
                const updateUser = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$addToSet: { savedBooks: args.input}},
                    {new: true, runValidators: true}
                );

                return updateUser;
            }

            throw new AuthenticationError("You need to be logged in to add a book!")
        },

        removeBook : async (parent, args, context) => {
            if(context.user){
                const updatedUser = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$pull: { savedBooks: {bookId: args.bookId}}},
                    {new: true}
                );

                return updatedUser;
            }

            throw new AuthenticationError("You need to be logged in!");
        }
    }
};

module.exports= resolvers;