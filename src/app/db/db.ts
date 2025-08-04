// import { UserRole, UserStatus } from "@prisma/client";
// import * as bcrypt from "bcrypt";
// import config from "../../config";
// import prisma from "../../shared/prisma";

// export const initiateSuperAdmin = async () => {
//   const hashedPassword = await bcrypt.hash(
//     "123456789",
//     Number(config.bcrypt_salt_rounds)
//   );
// const payload = {
//   email: "admin@expatglobalgroup.com",
//   password: hashedPassword,
//   status: UserStatus.ACTIVE,
//   role: UserRole.Admin,
//   firstName: "Super",
//   lastName: "Admin",
// };


//   const isExistUser = await prisma.user.findUnique({
//     where: {
//       phone: payload.email,
//     },
//   });

//   if (isExistUser) return;

//   await prisma.user.create({
//     data: payload,
//   });
// };
