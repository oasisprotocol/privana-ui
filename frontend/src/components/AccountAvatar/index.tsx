import { type FC } from 'react';
import { JazzIcon } from '../JazzIcon';
import { addressToJazzIconSeed } from '../JazzIcon/addressToJazzIconSeed';

interface AccountAvatarProps {
  diameter?: number;
  address?: `0x${string}`;
}

export const AccountAvatar: FC<AccountAvatarProps> = ({
  address,
  diameter = 30,
}) => {
  if (!address) {
    return null;
  }

  return <JazzIcon diameter={diameter} seed={addressToJazzIconSeed(address)} />;
};
