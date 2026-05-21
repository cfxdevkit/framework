export declare const CFX_NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export declare const WCFX_ADDRESSES: {
  readonly mainnet: '0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b';
  readonly testnet: '0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8';
};
export interface PairLike {
  token0: string;
  token1: string;
}
export interface SelectableTokenLike {
  address: string;
}
export interface TokenMetadata extends SelectableTokenLike {
  chainId: number;
  decimals: number;
  logoURI?: string;
  name: string;
  symbol: string;
}
export interface TokenSelectionOptions {
  nativeAddress?: string;
  wrappedNativeAddress?: string;
}
export declare const DEFAULT_MAINNET_TOKENS: (
  | {
      readonly address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Conflux';
      readonly symbol: 'CFX';
    }
  | {
      readonly address: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29213/large/xCFX.png?1696528171';
      readonly name: 'X nucleon CFX';
      readonly symbol: 'xCFX';
    }
  | {
      readonly address: '0xc6156867a903c8fe1f31336d70d62a09bc48a2b9';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xc6156867a903c8fe1f31336d70d62a09bc48a2b9.svg';
      readonly name: 'Go Conflux Network';
      readonly symbol: 'GCFX';
    }
  | {
      readonly address: '0x1858a8d367e69cd9e23d0da4169885a47f05f1be';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35446/large/sCFX.png?1709115985';
      readonly name: 'Shui CFX';
      readonly symbol: 'sCFX';
    }
  | {
      readonly address: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39558/large/wbtc.png?1722898375';
      readonly name: 'Wrapped BTC';
      readonly symbol: 'WBTC';
    }
  | {
      readonly address: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25019/large/512_lightmodeRound.png?1696524171';
      readonly name: 'Swappi Token';
      readonly symbol: 'PPI';
    }
  | {
      readonly address: '0x905f2202003453006eaf975699545f2e909079b8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29845/large/ABC_PoS_Pool-2.png?1696528772';
      readonly name: 'ABC PoS Pool';
      readonly symbol: 'ABC';
    }
  | {
      readonly address: '0xa47f43de2f9623acb395ca4905746496d2014d57';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39718/large/WETH.PNG?1723732211';
      readonly name: 'Ethereum Token';
      readonly symbol: 'ETH';
    }
  | {
      readonly address: '0x564ff017cb60977fffb3ccc4750eff47e5e37fd6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x564ff017cb60977fffb3ccc4750eff47e5e37fd6.svg';
      readonly name: 'GAD';
      readonly symbol: 'GAD';
    }
  | {
      readonly address: '0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16.svg';
      readonly name: 'InterworkingChain';
      readonly symbol: 'IWK';
    }
  | {
      readonly address: '0xf102a59574d58626c2c4a6c1dce8831fe408f890';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://effigy.im/a/0xf102a59574d58626c2c4a6c1dce8831fe408f890.svg';
      readonly name: 'worldmobiletoken';
      readonly symbol: 'WMT';
    }
  | {
      readonly address: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/70634/large/AnchorX_logo_RGB-01.png?1762887300';
      readonly name: 'AxCNH';
      readonly symbol: 'AxCNH';
    }
  | {
      readonly address: '0xa11ad495c3bf53c19368313a894ba49bc26e7f92';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xa11ad495c3bf53c19368313a894ba49bc26e7f92.svg';
      readonly name: 'PoS Compound CFX';
      readonly symbol: 'cCFX';
    }
  | {
      readonly address: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53070/large/wrapped_bnb.png?1735264554';
      readonly name: 'BNB';
      readonly symbol: 'BNB';
    }
  | {
      readonly address: '0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8.svg';
      readonly name: 'Pokon';
      readonly symbol: 'Pokon';
    }
  | {
      readonly address: '0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e.svg';
      readonly name: 'CFL';
      readonly symbol: 'CFL';
    }
  | {
      readonly address: '0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11.svg';
      readonly name: 'Confi';
      readonly symbol: 'Confi';
    }
  | {
      readonly address: '0xfb16f7405d26c5da7fa41e6f373b57953a121ff2';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/fye7ftb786rkb10oadfxe5k0etbw';
      readonly name: 'ConfiDoge';
      readonly symbol: 'CONFID';
    }
  | {
      readonly address: '0x15b838867b92c2b30e3e93ba0eb357b8ab6cbfb1';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/9ltduipbbefg1ubnjnkak3to43xq';
      readonly name: 'Dragon Coin';
      readonly symbol: 'DRAGON';
    }
  | {
      readonly address: '0x13db4686f3d1d9ec918a70ae8fbd52f82949906c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x13db4686f3d1d9ec918a70ae8fbd52f82949906c.svg';
      readonly name: 'PHX Governance Token';
      readonly symbol: 'PHX';
    }
  | {
      readonly address: '0x9cd6839db580a3037a310ed0eb965435c0972a2e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9cd6839db580a3037a310ed0eb965435c0972a2e.svg';
      readonly name: 'Aspike foundation';
      readonly symbol: 'APK';
    }
  | {
      readonly address: '0xf1f6e3aa98bac6c13230051e452065df299a78a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/36354/large/SHUI_token.png?1711561276';
      readonly name: 'Shui Token';
      readonly symbol: 'SHUI';
    }
  | {
      readonly address: '0x0a93f9c0a0fbdddd6f83c833f1e74963ce52120f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/nbpk4encz1tf59pdc0en5ip5mdcz';
      readonly name: 'ConFi Coin';
      readonly symbol: 'CONFI';
    }
  | {
      readonly address: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb4ca1cb2651a822bf65c614c880a26fd124932a3.svg';
      readonly name: 'Long Mai coin';
      readonly symbol: 'LOM';
    }
  | {
      readonly address: '0xfe197e7968807b311d476915db585831b43a7e3b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29144/large/NUT.png?1696528104';
      readonly name: 'Nucleon Governance Token';
      readonly symbol: 'NUT';
    }
  | {
      readonly address: '0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf.svg';
      readonly name: 'AUSD Stablecoin';
      readonly symbol: 'AUSD';
    }
  | {
      readonly address: '0x444449e9e35d51e5742bf52207879047946526d2';
      readonly chainId: 1030;
      readonly decimals: 1;
      readonly logoURI: 'https://effigy.im/a/0x444449e9e35d51e5742bf52207879047946526d2.svg';
      readonly name: '我国第三代自主超导量子计算机“本源悟空”成功装备国内首个PQC“抗量子攻击护盾”——PQC（Post Quantum Cryptography，后量子密码）混合加密方法。这将使“本源悟空”更好抵御其他量子计算机的攻击，确保运行数据安全。 ​ 量子计算机是一种利用量子力学原理进行信息处理的计算机。与传统计算机相比，量子计算机在处理某些特定问题时具有显著的优势，特别是在密码学领域。 创造价值1美元的加密货币比特币、以太坊、莱特币和门罗币的平均能耗分别为17、7、7和14兆焦耳。研究人员将此与开采价值1美元的不同金属，包括铝（122兆焦耳）、铜银（4兆焦耳）、金（5兆焦耳）、铂金（7兆焦耳）以及手机和其他电子产品中使用的稀土氧化物（9兆焦耳）所需的能源成本相比较，发现除了铝之外，加密货币挖矿的能源成本与实体金属采矿的能源成本相当甚至更大，且这一成本会随加密货币使用、购买、挖矿人数的增加而上升。孙悟空BG2LKT给唐老鸭打电话。说要请唐老鸭吃烤鸭。唐老鸭不想吃烤鸭。那应该请唐老鸭吃面吗？还是请他来家吃饺子吧。大家帮忙说吃烤鸭还是吃面还是吃饺子 ​。美国长期主导的国际体系是监听盟国政要“棱镜计划”“怒角计划”“强健计划”“上游计划”……美方名目众多的窃密监听行动一次又一次地证明：美国正是全球最大的网络攻击者，是名副其实的黑客帝国、窃听帝国、间谍帝国。';
      readonly symbol: 'BTC';
    }
  | {
      readonly address: '0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851.svg';
      readonly name: 'Chinese Dog';
      readonly symbol: 'Cdog';
    }
  | {
      readonly address: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb747a3317259e0aafe5a242c8e3f042a4b83627a.svg';
      readonly name: 'CFXs ERC20';
      readonly symbol: 'CFXs';
    }
  | {
      readonly address: '0x53aa2b7bead41614577ba5b636c482790c5f54c5';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x53aa2b7bead41614577ba5b636c482790c5f54c5.svg';
      readonly name: 'dForce';
      readonly symbol: 'DF';
    }
  | {
      readonly address: '0xb25480abfd2e17aa9ab4e7bc660aa45403743045';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb25480abfd2e17aa9ab4e7bc660aa45403743045.svg';
      readonly name: 'Daruma Doll';
      readonly symbol: 'DOLL';
    }
  | {
      readonly address: '0xba2289fee4673ef00ee8d8dae260965ab543b68f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xba2289fee4673ef00ee8d8dae260965ab543b68f.svg';
      readonly name: 'FansCoin';
      readonly symbol: 'FC';
    }
  | {
      readonly address: '0x9b36f165bab9ebe611d491180418d8de4b8f3a1f';
      readonly chainId: 1030;
      readonly decimals: 9;
      readonly logoURI: 'https://effigy.im/a/0x9b36f165bab9ebe611d491180418d8de4b8f3a1f.svg';
      readonly name: 'FLOKI';
      readonly symbol: 'FLOKI';
    }
  | {
      readonly address: '0x19aae9e4269ab47ff291125b5c0c2f7296a635ab';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/32474/large/goledo.jpg?1698261790';
      readonly name: 'Goledo Token Version 2';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0xa4b59aa3de2af57959c23e2c9c89a2fcb408ce6a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.coingecko.com/coins/images/28689/small/goledo_%281%29.jpg?1696527672';
      readonly name: 'Goledo Token';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0x0737dacea5f4e212525e7fba2e7ecaa069dedd28';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0737dacea5f4e212525e7fba2e7ecaa069dedd28.svg';
      readonly name: 'HydraSF';
      readonly symbol: 'HSF';
    }
  | {
      readonly address: '0x72952d09c19044059ce48007b289570b3320c8b6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x72952d09c19044059ce48007b289570b3320c8b6.svg';
      readonly name: 'Hydroxyl Token';
      readonly symbol: 'HYT';
    }
  | {
      readonly address: '0xd3cf900b0ec2194b418760e1494653449327692c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xd3cf900b0ec2194b418760e1494653449327692c.svg';
      readonly name: 'Meta Interstellar Token';
      readonly symbol: 'MIT';
    }
  | {
      readonly address: '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9fb9a33956351cf4fa040f65a13b835a3c8764e3.svg';
      readonly name: 'Multichain';
      readonly symbol: 'MULTI';
    }
  | {
      readonly address: '0xbecd75bde87020a4f0d3084bcce9cde794547660';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xbecd75bde87020a4f0d3084bcce9cde794547660.svg';
      readonly name: 'Maneki-Neko';
      readonly symbol: 'NEKO';
    }
  | {
      readonly address: '0xe669e77b2a9311efbea22ae8e5f6824ae20941a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe669e77b2a9311efbea22ae8e5f6824ae20941a7.svg';
      readonly name: 'OverSwap Token';
      readonly symbol: 'OVER';
    }
  | {
      readonly address: '0x0debbc26fcad98eda1415c407b44f54a769db7ac';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0debbc26fcad98eda1415c407b44f54a769db7ac.svg';
      readonly name: 'Study';
      readonly symbol: 'Study';
    }
  | {
      readonly address: '0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca.svg';
      readonly name: 'TriAngle DAO';
      readonly symbol: 'TAD';
    }
  | {
      readonly address: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35228/large/USDC.jpg?1707924447';
      readonly name: 'USD Coin';
      readonly symbol: 'USDC';
    }
  | {
      readonly address: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35054/large/USDT.png?1707233721';
      readonly name: 'Tether USD';
      readonly symbol: 'USDT';
    }
  | {
      readonly address: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53705/large/usdt0.jpg?1737086183';
      readonly name: 'USDT0';
      readonly symbol: 'USDT0';
    }
  | {
      readonly address: '0x422a86f57b6b6f1e557d406331c25eeed075e7aa';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x422a86f57b6b6f1e557d406331c25eeed075e7aa.svg';
      readonly name: 'dForce USD';
      readonly symbol: 'USX';
    }
  | {
      readonly address: '0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad.svg';
      readonly name: 'Unitus';
      readonly symbol: 'UTS';
    }
  | {
      readonly address: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Wrapped Conflux';
      readonly symbol: 'WCFX';
    }
  | {
      readonly address: '0x82e541a07af18633d990136b422fdad3a237d54e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x82e541a07af18633d990136b422fdad3a237d54e.svg';
      readonly name: 'ConfiX';
      readonly symbol: 'X';
    }
  | {
      readonly address: '0xf65050e2ac003569a4b18e612b86cc833afe5960';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xf65050e2ac003569a4b18e612b86cc833afe5960.svg';
      readonly name: 'X Libra USD';
      readonly symbol: 'xUSD';
    }
)[];
export declare const DEFAULT_MAINNET_ERC20_TOKENS: (
  | {
      readonly address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Conflux';
      readonly symbol: 'CFX';
    }
  | {
      readonly address: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29213/large/xCFX.png?1696528171';
      readonly name: 'X nucleon CFX';
      readonly symbol: 'xCFX';
    }
  | {
      readonly address: '0xc6156867a903c8fe1f31336d70d62a09bc48a2b9';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xc6156867a903c8fe1f31336d70d62a09bc48a2b9.svg';
      readonly name: 'Go Conflux Network';
      readonly symbol: 'GCFX';
    }
  | {
      readonly address: '0x1858a8d367e69cd9e23d0da4169885a47f05f1be';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35446/large/sCFX.png?1709115985';
      readonly name: 'Shui CFX';
      readonly symbol: 'sCFX';
    }
  | {
      readonly address: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39558/large/wbtc.png?1722898375';
      readonly name: 'Wrapped BTC';
      readonly symbol: 'WBTC';
    }
  | {
      readonly address: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25019/large/512_lightmodeRound.png?1696524171';
      readonly name: 'Swappi Token';
      readonly symbol: 'PPI';
    }
  | {
      readonly address: '0x905f2202003453006eaf975699545f2e909079b8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29845/large/ABC_PoS_Pool-2.png?1696528772';
      readonly name: 'ABC PoS Pool';
      readonly symbol: 'ABC';
    }
  | {
      readonly address: '0xa47f43de2f9623acb395ca4905746496d2014d57';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39718/large/WETH.PNG?1723732211';
      readonly name: 'Ethereum Token';
      readonly symbol: 'ETH';
    }
  | {
      readonly address: '0x564ff017cb60977fffb3ccc4750eff47e5e37fd6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x564ff017cb60977fffb3ccc4750eff47e5e37fd6.svg';
      readonly name: 'GAD';
      readonly symbol: 'GAD';
    }
  | {
      readonly address: '0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16.svg';
      readonly name: 'InterworkingChain';
      readonly symbol: 'IWK';
    }
  | {
      readonly address: '0xf102a59574d58626c2c4a6c1dce8831fe408f890';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://effigy.im/a/0xf102a59574d58626c2c4a6c1dce8831fe408f890.svg';
      readonly name: 'worldmobiletoken';
      readonly symbol: 'WMT';
    }
  | {
      readonly address: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/70634/large/AnchorX_logo_RGB-01.png?1762887300';
      readonly name: 'AxCNH';
      readonly symbol: 'AxCNH';
    }
  | {
      readonly address: '0xa11ad495c3bf53c19368313a894ba49bc26e7f92';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xa11ad495c3bf53c19368313a894ba49bc26e7f92.svg';
      readonly name: 'PoS Compound CFX';
      readonly symbol: 'cCFX';
    }
  | {
      readonly address: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53070/large/wrapped_bnb.png?1735264554';
      readonly name: 'BNB';
      readonly symbol: 'BNB';
    }
  | {
      readonly address: '0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8.svg';
      readonly name: 'Pokon';
      readonly symbol: 'Pokon';
    }
  | {
      readonly address: '0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e.svg';
      readonly name: 'CFL';
      readonly symbol: 'CFL';
    }
  | {
      readonly address: '0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11.svg';
      readonly name: 'Confi';
      readonly symbol: 'Confi';
    }
  | {
      readonly address: '0xfb16f7405d26c5da7fa41e6f373b57953a121ff2';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/fye7ftb786rkb10oadfxe5k0etbw';
      readonly name: 'ConfiDoge';
      readonly symbol: 'CONFID';
    }
  | {
      readonly address: '0x15b838867b92c2b30e3e93ba0eb357b8ab6cbfb1';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/9ltduipbbefg1ubnjnkak3to43xq';
      readonly name: 'Dragon Coin';
      readonly symbol: 'DRAGON';
    }
  | {
      readonly address: '0x13db4686f3d1d9ec918a70ae8fbd52f82949906c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x13db4686f3d1d9ec918a70ae8fbd52f82949906c.svg';
      readonly name: 'PHX Governance Token';
      readonly symbol: 'PHX';
    }
  | {
      readonly address: '0x9cd6839db580a3037a310ed0eb965435c0972a2e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9cd6839db580a3037a310ed0eb965435c0972a2e.svg';
      readonly name: 'Aspike foundation';
      readonly symbol: 'APK';
    }
  | {
      readonly address: '0xf1f6e3aa98bac6c13230051e452065df299a78a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/36354/large/SHUI_token.png?1711561276';
      readonly name: 'Shui Token';
      readonly symbol: 'SHUI';
    }
  | {
      readonly address: '0x0a93f9c0a0fbdddd6f83c833f1e74963ce52120f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/nbpk4encz1tf59pdc0en5ip5mdcz';
      readonly name: 'ConFi Coin';
      readonly symbol: 'CONFI';
    }
  | {
      readonly address: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb4ca1cb2651a822bf65c614c880a26fd124932a3.svg';
      readonly name: 'Long Mai coin';
      readonly symbol: 'LOM';
    }
  | {
      readonly address: '0xfe197e7968807b311d476915db585831b43a7e3b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29144/large/NUT.png?1696528104';
      readonly name: 'Nucleon Governance Token';
      readonly symbol: 'NUT';
    }
  | {
      readonly address: '0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf.svg';
      readonly name: 'AUSD Stablecoin';
      readonly symbol: 'AUSD';
    }
  | {
      readonly address: '0x444449e9e35d51e5742bf52207879047946526d2';
      readonly chainId: 1030;
      readonly decimals: 1;
      readonly logoURI: 'https://effigy.im/a/0x444449e9e35d51e5742bf52207879047946526d2.svg';
      readonly name: '我国第三代自主超导量子计算机“本源悟空”成功装备国内首个PQC“抗量子攻击护盾”——PQC（Post Quantum Cryptography，后量子密码）混合加密方法。这将使“本源悟空”更好抵御其他量子计算机的攻击，确保运行数据安全。 ​ 量子计算机是一种利用量子力学原理进行信息处理的计算机。与传统计算机相比，量子计算机在处理某些特定问题时具有显著的优势，特别是在密码学领域。 创造价值1美元的加密货币比特币、以太坊、莱特币和门罗币的平均能耗分别为17、7、7和14兆焦耳。研究人员将此与开采价值1美元的不同金属，包括铝（122兆焦耳）、铜银（4兆焦耳）、金（5兆焦耳）、铂金（7兆焦耳）以及手机和其他电子产品中使用的稀土氧化物（9兆焦耳）所需的能源成本相比较，发现除了铝之外，加密货币挖矿的能源成本与实体金属采矿的能源成本相当甚至更大，且这一成本会随加密货币使用、购买、挖矿人数的增加而上升。孙悟空BG2LKT给唐老鸭打电话。说要请唐老鸭吃烤鸭。唐老鸭不想吃烤鸭。那应该请唐老鸭吃面吗？还是请他来家吃饺子吧。大家帮忙说吃烤鸭还是吃面还是吃饺子 ​。美国长期主导的国际体系是监听盟国政要“棱镜计划”“怒角计划”“强健计划”“上游计划”……美方名目众多的窃密监听行动一次又一次地证明：美国正是全球最大的网络攻击者，是名副其实的黑客帝国、窃听帝国、间谍帝国。';
      readonly symbol: 'BTC';
    }
  | {
      readonly address: '0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851.svg';
      readonly name: 'Chinese Dog';
      readonly symbol: 'Cdog';
    }
  | {
      readonly address: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb747a3317259e0aafe5a242c8e3f042a4b83627a.svg';
      readonly name: 'CFXs ERC20';
      readonly symbol: 'CFXs';
    }
  | {
      readonly address: '0x53aa2b7bead41614577ba5b636c482790c5f54c5';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x53aa2b7bead41614577ba5b636c482790c5f54c5.svg';
      readonly name: 'dForce';
      readonly symbol: 'DF';
    }
  | {
      readonly address: '0xb25480abfd2e17aa9ab4e7bc660aa45403743045';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb25480abfd2e17aa9ab4e7bc660aa45403743045.svg';
      readonly name: 'Daruma Doll';
      readonly symbol: 'DOLL';
    }
  | {
      readonly address: '0xba2289fee4673ef00ee8d8dae260965ab543b68f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xba2289fee4673ef00ee8d8dae260965ab543b68f.svg';
      readonly name: 'FansCoin';
      readonly symbol: 'FC';
    }
  | {
      readonly address: '0x9b36f165bab9ebe611d491180418d8de4b8f3a1f';
      readonly chainId: 1030;
      readonly decimals: 9;
      readonly logoURI: 'https://effigy.im/a/0x9b36f165bab9ebe611d491180418d8de4b8f3a1f.svg';
      readonly name: 'FLOKI';
      readonly symbol: 'FLOKI';
    }
  | {
      readonly address: '0x19aae9e4269ab47ff291125b5c0c2f7296a635ab';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/32474/large/goledo.jpg?1698261790';
      readonly name: 'Goledo Token Version 2';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0xa4b59aa3de2af57959c23e2c9c89a2fcb408ce6a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.coingecko.com/coins/images/28689/small/goledo_%281%29.jpg?1696527672';
      readonly name: 'Goledo Token';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0x0737dacea5f4e212525e7fba2e7ecaa069dedd28';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0737dacea5f4e212525e7fba2e7ecaa069dedd28.svg';
      readonly name: 'HydraSF';
      readonly symbol: 'HSF';
    }
  | {
      readonly address: '0x72952d09c19044059ce48007b289570b3320c8b6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x72952d09c19044059ce48007b289570b3320c8b6.svg';
      readonly name: 'Hydroxyl Token';
      readonly symbol: 'HYT';
    }
  | {
      readonly address: '0xd3cf900b0ec2194b418760e1494653449327692c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xd3cf900b0ec2194b418760e1494653449327692c.svg';
      readonly name: 'Meta Interstellar Token';
      readonly symbol: 'MIT';
    }
  | {
      readonly address: '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9fb9a33956351cf4fa040f65a13b835a3c8764e3.svg';
      readonly name: 'Multichain';
      readonly symbol: 'MULTI';
    }
  | {
      readonly address: '0xbecd75bde87020a4f0d3084bcce9cde794547660';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xbecd75bde87020a4f0d3084bcce9cde794547660.svg';
      readonly name: 'Maneki-Neko';
      readonly symbol: 'NEKO';
    }
  | {
      readonly address: '0xe669e77b2a9311efbea22ae8e5f6824ae20941a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe669e77b2a9311efbea22ae8e5f6824ae20941a7.svg';
      readonly name: 'OverSwap Token';
      readonly symbol: 'OVER';
    }
  | {
      readonly address: '0x0debbc26fcad98eda1415c407b44f54a769db7ac';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0debbc26fcad98eda1415c407b44f54a769db7ac.svg';
      readonly name: 'Study';
      readonly symbol: 'Study';
    }
  | {
      readonly address: '0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca.svg';
      readonly name: 'TriAngle DAO';
      readonly symbol: 'TAD';
    }
  | {
      readonly address: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35228/large/USDC.jpg?1707924447';
      readonly name: 'USD Coin';
      readonly symbol: 'USDC';
    }
  | {
      readonly address: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35054/large/USDT.png?1707233721';
      readonly name: 'Tether USD';
      readonly symbol: 'USDT';
    }
  | {
      readonly address: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53705/large/usdt0.jpg?1737086183';
      readonly name: 'USDT0';
      readonly symbol: 'USDT0';
    }
  | {
      readonly address: '0x422a86f57b6b6f1e557d406331c25eeed075e7aa';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x422a86f57b6b6f1e557d406331c25eeed075e7aa.svg';
      readonly name: 'dForce USD';
      readonly symbol: 'USX';
    }
  | {
      readonly address: '0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad.svg';
      readonly name: 'Unitus';
      readonly symbol: 'UTS';
    }
  | {
      readonly address: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Wrapped Conflux';
      readonly symbol: 'WCFX';
    }
  | {
      readonly address: '0x82e541a07af18633d990136b422fdad3a237d54e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x82e541a07af18633d990136b422fdad3a237d54e.svg';
      readonly name: 'ConfiX';
      readonly symbol: 'X';
    }
  | {
      readonly address: '0xf65050e2ac003569a4b18e612b86cc833afe5960';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xf65050e2ac003569a4b18e612b86cc833afe5960.svg';
      readonly name: 'X Libra USD';
      readonly symbol: 'xUSD';
    }
)[];
export declare const DEFAULT_MAINNET_PAIRS: (
  | {
      readonly token0: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xc6156867a903c8fe1f31336d70d62a09bc48a2b9';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x1858a8d367e69cd9e23d0da4169885a47f05f1be';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly token1: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
    }
  | {
      readonly token0: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly token1: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
    }
  | {
      readonly token0: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly token1: '0x22f41abf77905f50df398f21213290597e7414dd';
    }
  | {
      readonly token0: '0x905f2202003453006eaf975699545f2e909079b8';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly token1: '0xa47f43de2f9623acb395ca4905746496d2014d57';
    }
  | {
      readonly token0: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
      readonly token1: '0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16';
    }
  | {
      readonly token0: '0x564ff017cb60977fffb3ccc4750eff47e5e37fd6';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xa47f43de2f9623acb395ca4905746496d2014d57';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xf102a59574d58626c2c4a6c1dce8831fe408f890';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly token1: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
    }
  | {
      readonly token0: '0xa11ad495c3bf53c19368313a894ba49bc26e7f92';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xc6156867a903c8fe1f31336d70d62a09bc48a2b9';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly token1: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
    }
  | {
      readonly token0: '0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11';
      readonly token1: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
    }
  | {
      readonly token0: '0xfb16f7405d26c5da7fa41e6f373b57953a121ff2';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x15b838867b92c2b30e3e93ba0eb357b8ab6cbfb1';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x13db4686f3d1d9ec918a70ae8fbd52f82949906c';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x9cd6839db580a3037a310ed0eb965435c0972a2e';
      readonly token1: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0xa47f43de2f9623acb395ca4905746496d2014d57';
    }
  | {
      readonly token0: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xf1f6e3aa98bac6c13230051e452065df299a78a7';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x0a93f9c0a0fbdddd6f83c833f1e74963ce52120f';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xfe197e7968807b311d476915db585831b43a7e3b';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
      readonly token1: '0xfe197e7968807b311d476915db585831b43a7e3b';
    }
  | {
      readonly token0: '0x422a86f57b6b6f1e557d406331c25eeed075e7aa';
      readonly token1: '0x53aa2b7bead41614577ba5b636c482790c5f54c5';
    }
  | {
      readonly token0: '0xfe197e7968807b311d476915db585831b43a7e3b';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x564ff017cb60977fffb3ccc4750eff47e5e37fd6';
      readonly token1: '0x0debbc26fcad98eda1415c407b44f54a769db7ac';
    }
  | {
      readonly token0: '0x19aae9e4269ab47ff291125b5c0c2f7296a635ab';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xd3cf900b0ec2194b418760e1494653449327692c';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x72952d09c19044059ce48007b289570b3320c8b6';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x422a86f57b6b6f1e557d406331c25eeed075e7aa';
      readonly token1: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0x905f2202003453006eaf975699545f2e909079b8';
    }
  | {
      readonly token0: '0x0737dacea5f4e212525e7fba2e7ecaa069dedd28';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x9b36f165bab9ebe611d491180418d8de4b8f3a1f';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xa4b59aa3de2af57959c23e2c9c89a2fcb408ce6a';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly token1: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
    }
  | {
      readonly token0: '0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xbecd75bde87020a4f0d3084bcce9cde794547660';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
    }
  | {
      readonly token0: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x905f2202003453006eaf975699545f2e909079b8';
      readonly token1: '0xd3cf900b0ec2194b418760e1494653449327692c';
    }
  | {
      readonly token0: '0x82e541a07af18633d990136b422fdad3a237d54e';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xba2289fee4673ef00ee8d8dae260965ab543b68f';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly token1: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
    }
  | {
      readonly token0: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly token1: '0xa47f43de2f9623acb395ca4905746496d2014d57';
    }
  | {
      readonly token0: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly token1: '0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851';
    }
  | {
      readonly token0: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
      readonly token1: '0xa47f43de2f9623acb395ca4905746496d2014d57';
    }
  | {
      readonly token0: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
      readonly token1: '0xa47f43de2f9623acb395ca4905746496d2014d57';
    }
  | {
      readonly token0: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly token1: '0xfe197e7968807b311d476915db585831b43a7e3b';
    }
  | {
      readonly token0: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
      readonly token1: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
    }
  | {
      readonly token0: '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x1858a8d367e69cd9e23d0da4169885a47f05f1be';
      readonly token1: '0xf1f6e3aa98bac6c13230051e452065df299a78a7';
    }
  | {
      readonly token0: '0x0debbc26fcad98eda1415c407b44f54a769db7ac';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly token1: '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3';
    }
  | {
      readonly token0: '0x444449e9e35d51e5742bf52207879047946526d2';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x905f2202003453006eaf975699545f2e909079b8';
      readonly token1: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
    }
  | {
      readonly token0: '0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xe669e77b2a9311efbea22ae8e5f6824ae20941a7';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0x72952d09c19044059ce48007b289570b3320c8b6';
    }
  | {
      readonly token0: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly token1: '0x22f41abf77905f50df398f21213290597e7414dd';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0xbecd75bde87020a4f0d3084bcce9cde794547660';
    }
  | {
      readonly token0: '0xe669e77b2a9311efbea22ae8e5f6824ae20941a7';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly token1: '0xbecd75bde87020a4f0d3084bcce9cde794547660';
    }
  | {
      readonly token0: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x19aae9e4269ab47ff291125b5c0c2f7296a635ab';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16';
      readonly token1: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
    }
  | {
      readonly token0: '0xa4b59aa3de2af57959c23e2c9c89a2fcb408ce6a';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
    }
  | {
      readonly token0: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly token1: '0xe669e77b2a9311efbea22ae8e5f6824ae20941a7';
    }
  | {
      readonly token0: '0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
      readonly token1: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
    }
  | {
      readonly token0: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly token1: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
    }
  | {
      readonly token0: '0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad';
      readonly token1: '0x422a86f57b6b6f1e557d406331c25eeed075e7aa';
    }
  | {
      readonly token0: '0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly token1: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
    }
  | {
      readonly token0: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xb25480abfd2e17aa9ab4e7bc660aa45403743045';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly token1: '0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca';
    }
  | {
      readonly token0: '0x9b36f165bab9ebe611d491180418d8de4b8f3a1f';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0xf65050e2ac003569a4b18e612b86cc833afe5960';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
  | {
      readonly token0: '0xb25480abfd2e17aa9ab4e7bc660aa45403743045';
      readonly token1: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
    }
  | {
      readonly token0: '0x72952d09c19044059ce48007b289570b3320c8b6';
      readonly token1: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
    }
)[];
export interface UseSelectableTokensOptions<TToken extends SelectableTokenLike> {
  options?: TokenSelectionOptions;
  pairs: readonly PairLike[];
  tokenInAddress: string;
  tokens: readonly TToken[];
}
export declare function normalizeAddress(address: string): string;
export declare function wcfxAddress(network?: keyof typeof WCFX_ADDRESSES): string;
export declare function resolveTokenAddress(
  address: string,
  wrappedNativeAddress?: string,
  nativeAddress?: string,
): string;
export declare function resolveDisplayTokenAddress(
  address: string,
  wrappedNativeAddress?: string,
  nativeAddress?: string,
): string;
export declare function getDisplayTokens<TToken extends SelectableTokenLike>(
  tokens: readonly TToken[],
  options?: TokenSelectionOptions,
): TToken[];
export declare const DEFAULT_MAINNET_DISPLAY_TOKENS: (
  | {
      readonly address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Conflux';
      readonly symbol: 'CFX';
    }
  | {
      readonly address: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29213/large/xCFX.png?1696528171';
      readonly name: 'X nucleon CFX';
      readonly symbol: 'xCFX';
    }
  | {
      readonly address: '0xc6156867a903c8fe1f31336d70d62a09bc48a2b9';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xc6156867a903c8fe1f31336d70d62a09bc48a2b9.svg';
      readonly name: 'Go Conflux Network';
      readonly symbol: 'GCFX';
    }
  | {
      readonly address: '0x1858a8d367e69cd9e23d0da4169885a47f05f1be';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35446/large/sCFX.png?1709115985';
      readonly name: 'Shui CFX';
      readonly symbol: 'sCFX';
    }
  | {
      readonly address: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39558/large/wbtc.png?1722898375';
      readonly name: 'Wrapped BTC';
      readonly symbol: 'WBTC';
    }
  | {
      readonly address: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25019/large/512_lightmodeRound.png?1696524171';
      readonly name: 'Swappi Token';
      readonly symbol: 'PPI';
    }
  | {
      readonly address: '0x905f2202003453006eaf975699545f2e909079b8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29845/large/ABC_PoS_Pool-2.png?1696528772';
      readonly name: 'ABC PoS Pool';
      readonly symbol: 'ABC';
    }
  | {
      readonly address: '0xa47f43de2f9623acb395ca4905746496d2014d57';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39718/large/WETH.PNG?1723732211';
      readonly name: 'Ethereum Token';
      readonly symbol: 'ETH';
    }
  | {
      readonly address: '0x564ff017cb60977fffb3ccc4750eff47e5e37fd6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x564ff017cb60977fffb3ccc4750eff47e5e37fd6.svg';
      readonly name: 'GAD';
      readonly symbol: 'GAD';
    }
  | {
      readonly address: '0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16.svg';
      readonly name: 'InterworkingChain';
      readonly symbol: 'IWK';
    }
  | {
      readonly address: '0xf102a59574d58626c2c4a6c1dce8831fe408f890';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://effigy.im/a/0xf102a59574d58626c2c4a6c1dce8831fe408f890.svg';
      readonly name: 'worldmobiletoken';
      readonly symbol: 'WMT';
    }
  | {
      readonly address: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/70634/large/AnchorX_logo_RGB-01.png?1762887300';
      readonly name: 'AxCNH';
      readonly symbol: 'AxCNH';
    }
  | {
      readonly address: '0xa11ad495c3bf53c19368313a894ba49bc26e7f92';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xa11ad495c3bf53c19368313a894ba49bc26e7f92.svg';
      readonly name: 'PoS Compound CFX';
      readonly symbol: 'cCFX';
    }
  | {
      readonly address: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53070/large/wrapped_bnb.png?1735264554';
      readonly name: 'BNB';
      readonly symbol: 'BNB';
    }
  | {
      readonly address: '0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8.svg';
      readonly name: 'Pokon';
      readonly symbol: 'Pokon';
    }
  | {
      readonly address: '0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e.svg';
      readonly name: 'CFL';
      readonly symbol: 'CFL';
    }
  | {
      readonly address: '0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11.svg';
      readonly name: 'Confi';
      readonly symbol: 'Confi';
    }
  | {
      readonly address: '0xfb16f7405d26c5da7fa41e6f373b57953a121ff2';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/fye7ftb786rkb10oadfxe5k0etbw';
      readonly name: 'ConfiDoge';
      readonly symbol: 'CONFID';
    }
  | {
      readonly address: '0x15b838867b92c2b30e3e93ba0eb357b8ab6cbfb1';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/9ltduipbbefg1ubnjnkak3to43xq';
      readonly name: 'Dragon Coin';
      readonly symbol: 'DRAGON';
    }
  | {
      readonly address: '0x13db4686f3d1d9ec918a70ae8fbd52f82949906c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x13db4686f3d1d9ec918a70ae8fbd52f82949906c.svg';
      readonly name: 'PHX Governance Token';
      readonly symbol: 'PHX';
    }
  | {
      readonly address: '0x9cd6839db580a3037a310ed0eb965435c0972a2e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9cd6839db580a3037a310ed0eb965435c0972a2e.svg';
      readonly name: 'Aspike foundation';
      readonly symbol: 'APK';
    }
  | {
      readonly address: '0xf1f6e3aa98bac6c13230051e452065df299a78a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/36354/large/SHUI_token.png?1711561276';
      readonly name: 'Shui Token';
      readonly symbol: 'SHUI';
    }
  | {
      readonly address: '0x0a93f9c0a0fbdddd6f83c833f1e74963ce52120f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/nbpk4encz1tf59pdc0en5ip5mdcz';
      readonly name: 'ConFi Coin';
      readonly symbol: 'CONFI';
    }
  | {
      readonly address: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb4ca1cb2651a822bf65c614c880a26fd124932a3.svg';
      readonly name: 'Long Mai coin';
      readonly symbol: 'LOM';
    }
  | {
      readonly address: '0xfe197e7968807b311d476915db585831b43a7e3b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29144/large/NUT.png?1696528104';
      readonly name: 'Nucleon Governance Token';
      readonly symbol: 'NUT';
    }
  | {
      readonly address: '0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf.svg';
      readonly name: 'AUSD Stablecoin';
      readonly symbol: 'AUSD';
    }
  | {
      readonly address: '0x444449e9e35d51e5742bf52207879047946526d2';
      readonly chainId: 1030;
      readonly decimals: 1;
      readonly logoURI: 'https://effigy.im/a/0x444449e9e35d51e5742bf52207879047946526d2.svg';
      readonly name: '我国第三代自主超导量子计算机“本源悟空”成功装备国内首个PQC“抗量子攻击护盾”——PQC（Post Quantum Cryptography，后量子密码）混合加密方法。这将使“本源悟空”更好抵御其他量子计算机的攻击，确保运行数据安全。 ​ 量子计算机是一种利用量子力学原理进行信息处理的计算机。与传统计算机相比，量子计算机在处理某些特定问题时具有显著的优势，特别是在密码学领域。 创造价值1美元的加密货币比特币、以太坊、莱特币和门罗币的平均能耗分别为17、7、7和14兆焦耳。研究人员将此与开采价值1美元的不同金属，包括铝（122兆焦耳）、铜银（4兆焦耳）、金（5兆焦耳）、铂金（7兆焦耳）以及手机和其他电子产品中使用的稀土氧化物（9兆焦耳）所需的能源成本相比较，发现除了铝之外，加密货币挖矿的能源成本与实体金属采矿的能源成本相当甚至更大，且这一成本会随加密货币使用、购买、挖矿人数的增加而上升。孙悟空BG2LKT给唐老鸭打电话。说要请唐老鸭吃烤鸭。唐老鸭不想吃烤鸭。那应该请唐老鸭吃面吗？还是请他来家吃饺子吧。大家帮忙说吃烤鸭还是吃面还是吃饺子 ​。美国长期主导的国际体系是监听盟国政要“棱镜计划”“怒角计划”“强健计划”“上游计划”……美方名目众多的窃密监听行动一次又一次地证明：美国正是全球最大的网络攻击者，是名副其实的黑客帝国、窃听帝国、间谍帝国。';
      readonly symbol: 'BTC';
    }
  | {
      readonly address: '0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851.svg';
      readonly name: 'Chinese Dog';
      readonly symbol: 'Cdog';
    }
  | {
      readonly address: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb747a3317259e0aafe5a242c8e3f042a4b83627a.svg';
      readonly name: 'CFXs ERC20';
      readonly symbol: 'CFXs';
    }
  | {
      readonly address: '0x53aa2b7bead41614577ba5b636c482790c5f54c5';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x53aa2b7bead41614577ba5b636c482790c5f54c5.svg';
      readonly name: 'dForce';
      readonly symbol: 'DF';
    }
  | {
      readonly address: '0xb25480abfd2e17aa9ab4e7bc660aa45403743045';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb25480abfd2e17aa9ab4e7bc660aa45403743045.svg';
      readonly name: 'Daruma Doll';
      readonly symbol: 'DOLL';
    }
  | {
      readonly address: '0xba2289fee4673ef00ee8d8dae260965ab543b68f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xba2289fee4673ef00ee8d8dae260965ab543b68f.svg';
      readonly name: 'FansCoin';
      readonly symbol: 'FC';
    }
  | {
      readonly address: '0x9b36f165bab9ebe611d491180418d8de4b8f3a1f';
      readonly chainId: 1030;
      readonly decimals: 9;
      readonly logoURI: 'https://effigy.im/a/0x9b36f165bab9ebe611d491180418d8de4b8f3a1f.svg';
      readonly name: 'FLOKI';
      readonly symbol: 'FLOKI';
    }
  | {
      readonly address: '0x19aae9e4269ab47ff291125b5c0c2f7296a635ab';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/32474/large/goledo.jpg?1698261790';
      readonly name: 'Goledo Token Version 2';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0xa4b59aa3de2af57959c23e2c9c89a2fcb408ce6a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.coingecko.com/coins/images/28689/small/goledo_%281%29.jpg?1696527672';
      readonly name: 'Goledo Token';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0x0737dacea5f4e212525e7fba2e7ecaa069dedd28';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0737dacea5f4e212525e7fba2e7ecaa069dedd28.svg';
      readonly name: 'HydraSF';
      readonly symbol: 'HSF';
    }
  | {
      readonly address: '0x72952d09c19044059ce48007b289570b3320c8b6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x72952d09c19044059ce48007b289570b3320c8b6.svg';
      readonly name: 'Hydroxyl Token';
      readonly symbol: 'HYT';
    }
  | {
      readonly address: '0xd3cf900b0ec2194b418760e1494653449327692c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xd3cf900b0ec2194b418760e1494653449327692c.svg';
      readonly name: 'Meta Interstellar Token';
      readonly symbol: 'MIT';
    }
  | {
      readonly address: '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9fb9a33956351cf4fa040f65a13b835a3c8764e3.svg';
      readonly name: 'Multichain';
      readonly symbol: 'MULTI';
    }
  | {
      readonly address: '0xbecd75bde87020a4f0d3084bcce9cde794547660';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xbecd75bde87020a4f0d3084bcce9cde794547660.svg';
      readonly name: 'Maneki-Neko';
      readonly symbol: 'NEKO';
    }
  | {
      readonly address: '0xe669e77b2a9311efbea22ae8e5f6824ae20941a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe669e77b2a9311efbea22ae8e5f6824ae20941a7.svg';
      readonly name: 'OverSwap Token';
      readonly symbol: 'OVER';
    }
  | {
      readonly address: '0x0debbc26fcad98eda1415c407b44f54a769db7ac';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0debbc26fcad98eda1415c407b44f54a769db7ac.svg';
      readonly name: 'Study';
      readonly symbol: 'Study';
    }
  | {
      readonly address: '0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca.svg';
      readonly name: 'TriAngle DAO';
      readonly symbol: 'TAD';
    }
  | {
      readonly address: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35228/large/USDC.jpg?1707924447';
      readonly name: 'USD Coin';
      readonly symbol: 'USDC';
    }
  | {
      readonly address: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35054/large/USDT.png?1707233721';
      readonly name: 'Tether USD';
      readonly symbol: 'USDT';
    }
  | {
      readonly address: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53705/large/usdt0.jpg?1737086183';
      readonly name: 'USDT0';
      readonly symbol: 'USDT0';
    }
  | {
      readonly address: '0x422a86f57b6b6f1e557d406331c25eeed075e7aa';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x422a86f57b6b6f1e557d406331c25eeed075e7aa.svg';
      readonly name: 'dForce USD';
      readonly symbol: 'USX';
    }
  | {
      readonly address: '0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad.svg';
      readonly name: 'Unitus';
      readonly symbol: 'UTS';
    }
  | {
      readonly address: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Wrapped Conflux';
      readonly symbol: 'WCFX';
    }
  | {
      readonly address: '0x82e541a07af18633d990136b422fdad3a237d54e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x82e541a07af18633d990136b422fdad3a237d54e.svg';
      readonly name: 'ConfiX';
      readonly symbol: 'X';
    }
  | {
      readonly address: '0xf65050e2ac003569a4b18e612b86cc833afe5960';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xf65050e2ac003569a4b18e612b86cc833afe5960.svg';
      readonly name: 'X Libra USD';
      readonly symbol: 'xUSD';
    }
)[];
export declare const DEFAULT_MAINNET_DISPLAY_ERC20_TOKENS: (
  | {
      readonly address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Conflux';
      readonly symbol: 'CFX';
    }
  | {
      readonly address: '0x889138644274a7dc602f25a7e7d53ff40e6d0091';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29213/large/xCFX.png?1696528171';
      readonly name: 'X nucleon CFX';
      readonly symbol: 'xCFX';
    }
  | {
      readonly address: '0xc6156867a903c8fe1f31336d70d62a09bc48a2b9';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xc6156867a903c8fe1f31336d70d62a09bc48a2b9.svg';
      readonly name: 'Go Conflux Network';
      readonly symbol: 'GCFX';
    }
  | {
      readonly address: '0x1858a8d367e69cd9e23d0da4169885a47f05f1be';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35446/large/sCFX.png?1709115985';
      readonly name: 'Shui CFX';
      readonly symbol: 'sCFX';
    }
  | {
      readonly address: '0x1f545487c62e5acfea45dcadd9c627361d1616d8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39558/large/wbtc.png?1722898375';
      readonly name: 'Wrapped BTC';
      readonly symbol: 'WBTC';
    }
  | {
      readonly address: '0x22f41abf77905f50df398f21213290597e7414dd';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25019/large/512_lightmodeRound.png?1696524171';
      readonly name: 'Swappi Token';
      readonly symbol: 'PPI';
    }
  | {
      readonly address: '0x905f2202003453006eaf975699545f2e909079b8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29845/large/ABC_PoS_Pool-2.png?1696528772';
      readonly name: 'ABC PoS Pool';
      readonly symbol: 'ABC';
    }
  | {
      readonly address: '0xa47f43de2f9623acb395ca4905746496d2014d57';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/39718/large/WETH.PNG?1723732211';
      readonly name: 'Ethereum Token';
      readonly symbol: 'ETH';
    }
  | {
      readonly address: '0x564ff017cb60977fffb3ccc4750eff47e5e37fd6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x564ff017cb60977fffb3ccc4750eff47e5e37fd6.svg';
      readonly name: 'GAD';
      readonly symbol: 'GAD';
    }
  | {
      readonly address: '0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9caf5c4be5c07f98fb2c0dfd5f02661a94180f16.svg';
      readonly name: 'InterworkingChain';
      readonly symbol: 'IWK';
    }
  | {
      readonly address: '0xf102a59574d58626c2c4a6c1dce8831fe408f890';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://effigy.im/a/0xf102a59574d58626c2c4a6c1dce8831fe408f890.svg';
      readonly name: 'worldmobiletoken';
      readonly symbol: 'WMT';
    }
  | {
      readonly address: '0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/70634/large/AnchorX_logo_RGB-01.png?1762887300';
      readonly name: 'AxCNH';
      readonly symbol: 'AxCNH';
    }
  | {
      readonly address: '0xa11ad495c3bf53c19368313a894ba49bc26e7f92';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xa11ad495c3bf53c19368313a894ba49bc26e7f92.svg';
      readonly name: 'PoS Compound CFX';
      readonly symbol: 'cCFX';
    }
  | {
      readonly address: '0x94bd7a37d2ce24cc597e158facaa8d601083ffec';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53070/large/wrapped_bnb.png?1735264554';
      readonly name: 'BNB';
      readonly symbol: 'BNB';
    }
  | {
      readonly address: '0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xeb2fee0bb26cc33f63f4bd45b9b5f6e4f50f76a8.svg';
      readonly name: 'Pokon';
      readonly symbol: 'Pokon';
    }
  | {
      readonly address: '0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x8cbb19d5a1ebb5436795d96a9ed6d9fa0d4d0e8e.svg';
      readonly name: 'CFL';
      readonly symbol: 'CFL';
    }
  | {
      readonly address: '0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x26fb0c4288449efc7d38cda4eb3a23ef7b532a11.svg';
      readonly name: 'Confi';
      readonly symbol: 'Confi';
    }
  | {
      readonly address: '0xfb16f7405d26c5da7fa41e6f373b57953a121ff2';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/fye7ftb786rkb10oadfxe5k0etbw';
      readonly name: 'ConfiDoge';
      readonly symbol: 'CONFID';
    }
  | {
      readonly address: '0x15b838867b92c2b30e3e93ba0eb357b8ab6cbfb1';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/9ltduipbbefg1ubnjnkak3to43xq';
      readonly name: 'Dragon Coin';
      readonly symbol: 'DRAGON';
    }
  | {
      readonly address: '0x13db4686f3d1d9ec918a70ae8fbd52f82949906c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x13db4686f3d1d9ec918a70ae8fbd52f82949906c.svg';
      readonly name: 'PHX Governance Token';
      readonly symbol: 'PHX';
    }
  | {
      readonly address: '0x9cd6839db580a3037a310ed0eb965435c0972a2e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9cd6839db580a3037a310ed0eb965435c0972a2e.svg';
      readonly name: 'Aspike foundation';
      readonly symbol: 'APK';
    }
  | {
      readonly address: '0xf1f6e3aa98bac6c13230051e452065df299a78a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/36354/large/SHUI_token.png?1711561276';
      readonly name: 'Shui Token';
      readonly symbol: 'SHUI';
    }
  | {
      readonly address: '0x0a93f9c0a0fbdddd6f83c833f1e74963ce52120f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.geckoterminal.com/nbpk4encz1tf59pdc0en5ip5mdcz';
      readonly name: 'ConFi Coin';
      readonly symbol: 'CONFI';
    }
  | {
      readonly address: '0xb4ca1cb2651a822bf65c614c880a26fd124932a3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb4ca1cb2651a822bf65c614c880a26fd124932a3.svg';
      readonly name: 'Long Mai coin';
      readonly symbol: 'LOM';
    }
  | {
      readonly address: '0xfe197e7968807b311d476915db585831b43a7e3b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/29144/large/NUT.png?1696528104';
      readonly name: 'Nucleon Governance Token';
      readonly symbol: 'NUT';
    }
  | {
      readonly address: '0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xff33b107a0e2c0794ac43c3ffaf637fcea3697cf.svg';
      readonly name: 'AUSD Stablecoin';
      readonly symbol: 'AUSD';
    }
  | {
      readonly address: '0x444449e9e35d51e5742bf52207879047946526d2';
      readonly chainId: 1030;
      readonly decimals: 1;
      readonly logoURI: 'https://effigy.im/a/0x444449e9e35d51e5742bf52207879047946526d2.svg';
      readonly name: '我国第三代自主超导量子计算机“本源悟空”成功装备国内首个PQC“抗量子攻击护盾”——PQC（Post Quantum Cryptography，后量子密码）混合加密方法。这将使“本源悟空”更好抵御其他量子计算机的攻击，确保运行数据安全。 ​ 量子计算机是一种利用量子力学原理进行信息处理的计算机。与传统计算机相比，量子计算机在处理某些特定问题时具有显著的优势，特别是在密码学领域。 创造价值1美元的加密货币比特币、以太坊、莱特币和门罗币的平均能耗分别为17、7、7和14兆焦耳。研究人员将此与开采价值1美元的不同金属，包括铝（122兆焦耳）、铜银（4兆焦耳）、金（5兆焦耳）、铂金（7兆焦耳）以及手机和其他电子产品中使用的稀土氧化物（9兆焦耳）所需的能源成本相比较，发现除了铝之外，加密货币挖矿的能源成本与实体金属采矿的能源成本相当甚至更大，且这一成本会随加密货币使用、购买、挖矿人数的增加而上升。孙悟空BG2LKT给唐老鸭打电话。说要请唐老鸭吃烤鸭。唐老鸭不想吃烤鸭。那应该请唐老鸭吃面吗？还是请他来家吃饺子吧。大家帮忙说吃烤鸭还是吃面还是吃饺子 ​。美国长期主导的国际体系是监听盟国政要“棱镜计划”“怒角计划”“强健计划”“上游计划”……美方名目众多的窃密监听行动一次又一次地证明：美国正是全球最大的网络攻击者，是名副其实的黑客帝国、窃听帝国、间谍帝国。';
      readonly symbol: 'BTC';
    }
  | {
      readonly address: '0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe51e6da8f5d10bd4edc7c700fdff4a7ff7a9b851.svg';
      readonly name: 'Chinese Dog';
      readonly symbol: 'Cdog';
    }
  | {
      readonly address: '0xb747a3317259e0aafe5a242c8e3f042a4b83627a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb747a3317259e0aafe5a242c8e3f042a4b83627a.svg';
      readonly name: 'CFXs ERC20';
      readonly symbol: 'CFXs';
    }
  | {
      readonly address: '0x53aa2b7bead41614577ba5b636c482790c5f54c5';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x53aa2b7bead41614577ba5b636c482790c5f54c5.svg';
      readonly name: 'dForce';
      readonly symbol: 'DF';
    }
  | {
      readonly address: '0xb25480abfd2e17aa9ab4e7bc660aa45403743045';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xb25480abfd2e17aa9ab4e7bc660aa45403743045.svg';
      readonly name: 'Daruma Doll';
      readonly symbol: 'DOLL';
    }
  | {
      readonly address: '0xba2289fee4673ef00ee8d8dae260965ab543b68f';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xba2289fee4673ef00ee8d8dae260965ab543b68f.svg';
      readonly name: 'FansCoin';
      readonly symbol: 'FC';
    }
  | {
      readonly address: '0x9b36f165bab9ebe611d491180418d8de4b8f3a1f';
      readonly chainId: 1030;
      readonly decimals: 9;
      readonly logoURI: 'https://effigy.im/a/0x9b36f165bab9ebe611d491180418d8de4b8f3a1f.svg';
      readonly name: 'FLOKI';
      readonly symbol: 'FLOKI';
    }
  | {
      readonly address: '0x19aae9e4269ab47ff291125b5c0c2f7296a635ab';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/32474/large/goledo.jpg?1698261790';
      readonly name: 'Goledo Token Version 2';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0xa4b59aa3de2af57959c23e2c9c89a2fcb408ce6a';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://assets.coingecko.com/coins/images/28689/small/goledo_%281%29.jpg?1696527672';
      readonly name: 'Goledo Token';
      readonly symbol: 'GOL';
    }
  | {
      readonly address: '0x0737dacea5f4e212525e7fba2e7ecaa069dedd28';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0737dacea5f4e212525e7fba2e7ecaa069dedd28.svg';
      readonly name: 'HydraSF';
      readonly symbol: 'HSF';
    }
  | {
      readonly address: '0x72952d09c19044059ce48007b289570b3320c8b6';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x72952d09c19044059ce48007b289570b3320c8b6.svg';
      readonly name: 'Hydroxyl Token';
      readonly symbol: 'HYT';
    }
  | {
      readonly address: '0xd3cf900b0ec2194b418760e1494653449327692c';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xd3cf900b0ec2194b418760e1494653449327692c.svg';
      readonly name: 'Meta Interstellar Token';
      readonly symbol: 'MIT';
    }
  | {
      readonly address: '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x9fb9a33956351cf4fa040f65a13b835a3c8764e3.svg';
      readonly name: 'Multichain';
      readonly symbol: 'MULTI';
    }
  | {
      readonly address: '0xbecd75bde87020a4f0d3084bcce9cde794547660';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xbecd75bde87020a4f0d3084bcce9cde794547660.svg';
      readonly name: 'Maneki-Neko';
      readonly symbol: 'NEKO';
    }
  | {
      readonly address: '0xe669e77b2a9311efbea22ae8e5f6824ae20941a7';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xe669e77b2a9311efbea22ae8e5f6824ae20941a7.svg';
      readonly name: 'OverSwap Token';
      readonly symbol: 'OVER';
    }
  | {
      readonly address: '0x0debbc26fcad98eda1415c407b44f54a769db7ac';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x0debbc26fcad98eda1415c407b44f54a769db7ac.svg';
      readonly name: 'Study';
      readonly symbol: 'Study';
    }
  | {
      readonly address: '0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x6138c1073e3cd4a4cf71bcbc8dbf0aaf0cd8e0ca.svg';
      readonly name: 'TriAngle DAO';
      readonly symbol: 'TAD';
    }
  | {
      readonly address: '0x6963efed0ab40f6c3d7bda44a05dcf1437c44372';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35228/large/USDC.jpg?1707924447';
      readonly name: 'USD Coin';
      readonly symbol: 'USDC';
    }
  | {
      readonly address: '0xfe97e85d13abd9c1c33384e796f10b73905637ce';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/35054/large/USDT.png?1707233721';
      readonly name: 'Tether USD';
      readonly symbol: 'USDT';
    }
  | {
      readonly address: '0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff';
      readonly chainId: 1030;
      readonly decimals: 6;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/53705/large/usdt0.jpg?1737086183';
      readonly name: 'USDT0';
      readonly symbol: 'USDT0';
    }
  | {
      readonly address: '0x422a86f57b6b6f1e557d406331c25eeed075e7aa';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x422a86f57b6b6f1e557d406331c25eeed075e7aa.svg';
      readonly name: 'dForce USD';
      readonly symbol: 'USX';
    }
  | {
      readonly address: '0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x3b6564b5da73a41d3a66e6558a98fd0e9e1e77ad.svg';
      readonly name: 'Unitus';
      readonly symbol: 'UTS';
    }
  | {
      readonly address: '0x14b2d3bc65e74dae1030eafd8ac30c533c976a9b';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://coin-images.coingecko.com/coins/images/25557/large/conflux.png?1696524689';
      readonly name: 'Wrapped Conflux';
      readonly symbol: 'WCFX';
    }
  | {
      readonly address: '0x82e541a07af18633d990136b422fdad3a237d54e';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0x82e541a07af18633d990136b422fdad3a237d54e.svg';
      readonly name: 'ConfiX';
      readonly symbol: 'X';
    }
  | {
      readonly address: '0xf65050e2ac003569a4b18e612b86cc833afe5960';
      readonly chainId: 1030;
      readonly decimals: 18;
      readonly logoURI: 'https://effigy.im/a/0xf65050e2ac003569a4b18e612b86cc833afe5960.svg';
      readonly name: 'X Libra USD';
      readonly symbol: 'xUSD';
    }
)[];
export declare function getPairedTokens<TToken extends SelectableTokenLike>(
  pairs: readonly PairLike[],
  allTokens: readonly TToken[],
  tokenInAddress: string,
  options?: TokenSelectionOptions,
): TToken[];
export declare function useSelectableTokens<TToken extends SelectableTokenLike>(
  options: UseSelectableTokensOptions<TToken>,
): TToken[];
//# sourceMappingURL=tokens.d.ts.map
