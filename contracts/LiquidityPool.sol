// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TrustLand Liquidity Pool
 * @notice This contract manages the stablecoin pool for loan disbursements and repayments
 * @dev Works in conjunction with Escrow and Waterfall contracts
 */
contract LiquidityPool is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant WATERFALL_ROLE = keccak256("WATERFALL_ROLE");
    bytes32 public constant LOAN_MANAGER_ROLE = keccak256("LOAN_MANAGER_ROLE");
    
    // The stablecoin used for all operations
    IERC20 public stablecoin;
    
    // Deposit window status
    bool public depositWindowOpen;
    
    // Pool metrics
    uint256 public totalLiquidity;
    uint256 public availableLiquidity;
    uint256 public totalLoaned;
    uint256 public totalRepaid;
    uint256 public totalDefaulted;
    uint256 public reserveFundBalance;
    
    // Minimum percentage of available liquidity kept as reserve fund (1% = 100)
    uint256 public reserveRatio = 500; // 5% default
    
    // Provider tracking
    mapping(address => uint256) public providerBalances;
    address[] public providers;
    
    // Events
    event LiquidityAdded(address indexed provider, uint256 amount, uint256 newTotalLiquidity);
    event LiquidityRemoved(address indexed provider, uint256 amount, uint256 newTotalLiquidity);
    event LoanDisbursed(address indexed borrower, bytes32 indexed loanId, uint256 amount);
    event RepaymentReceived(address indexed borrower, bytes32 indexed loanId, uint256 amount);
    event DefaultCovered(bytes32 indexed loanId, uint256 amount, uint256 fromReserveFund);
    event DepositWindowStatusChanged(bool isOpen);
    event ReserveRatioChanged(uint256 oldRatio, uint256 newRatio);
    event ReserveFundIncreased(uint256 amount, uint256 newBalance);
    event ReserveFundDecreased(uint256 amount, uint256 newBalance);
    
    /**
     * @dev Initializes the contract with the stablecoin address and sets the admin role
     * @param _stablecoin Address of the ERC20 stablecoin used
     */
    constructor(address _stablecoin) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        
        stablecoin = IERC20(_stablecoin);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        
        depositWindowOpen = false;
    }
    
    /**
     * @notice Opens the deposit window to allow providers to add liquidity
     * @dev Only callable by operators
     */
    function openDepositWindow() external onlyRole(OPERATOR_ROLE) {
        depositWindowOpen = true;
        emit DepositWindowStatusChanged(true);
    }
    
    /**
     * @notice Closes the deposit window
     * @dev Only callable by operators
     */
    function closeDepositWindow() external onlyRole(OPERATOR_ROLE) {
        depositWindowOpen = false;
        emit DepositWindowStatusChanged(false);
    }
    
    /**
     * @notice Adds liquidity to the pool
     * @dev Only allowed when deposit window is open
     * @param amount Amount of stablecoin to add
     */
    function addLiquidity(uint256 amount) external whenNotPaused {
        require(depositWindowOpen, "Deposit window closed");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens from provider to this contract
        require(stablecoin.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update provider balances
        if (providerBalances[msg.sender] == 0) {
            providers.push(msg.sender);
        }
        providerBalances[msg.sender] += amount;
        
        // Update pool metrics
        totalLiquidity += amount;
        availableLiquidity += amount;
        
        // Calculate amount for reserve fund (5% by default)
        uint256 reserveAmount = (amount * reserveRatio) / 10000;
        if (reserveAmount > 0) {
            availableLiquidity -= reserveAmount;
            reserveFundBalance += reserveAmount;
            emit ReserveFundIncreased(reserveAmount, reserveFundBalance);
        }
        
        emit LiquidityAdded(msg.sender, amount, totalLiquidity);
    }
    
    /**
     * @notice Removes liquidity from the pool
     * @dev Only allowed when deposit window is open
     * @param amount Amount of stablecoin to remove
     */
    function removeLiquidity(uint256 amount) external whenNotPaused nonReentrant {
        require(depositWindowOpen, "Withdrawal window closed");
        require(amount > 0, "Amount must be greater than 0");
        require(providerBalances[msg.sender] >= amount, "Insufficient balance");
        require(availableLiquidity >= amount, "Insufficient liquidity");
        
        // Update provider balances
        providerBalances[msg.sender] -= amount;
        if (providerBalances[msg.sender] == 0) {
            _removeProvider(msg.sender);
        }
        
        // Update pool metrics
        totalLiquidity -= amount;
        availableLiquidity -= amount;
        
        // Transfer tokens to provider
        require(stablecoin.transfer(msg.sender, amount), "Transfer failed");
        
        emit LiquidityRemoved(msg.sender, amount, totalLiquidity);
    }
    
    /**
     * @notice Disburses a loan to a borrower
     * @dev Only callable by authorized loan manager
     * @param borrower Address of the borrower
     * @param loanId Unique identifier for the loan
     * @param amount Amount to disburse
     */
    function disburseLoan(address borrower, bytes32 loanId, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyRole(LOAN_MANAGER_ROLE) 
    {
        require(borrower != address(0), "Invalid borrower address");
        require(amount > 0, "Amount must be greater than 0");
        require(availableLiquidity >= amount, "Insufficient liquidity");
        
        // Update pool metrics
        availableLiquidity -= amount;
        totalLoaned += amount;
        
        // Transfer tokens to borrower
        require(stablecoin.transfer(borrower, amount), "Transfer failed");
        
        emit LoanDisbursed(borrower, loanId, amount);
    }
    
    /**
     * @notice Processes a loan repayment
     * @dev Can be called by anyone, typically the loan manager contract
     * @param loanId Unique identifier for the loan
     * @param amount Amount being repaid
     */
    function receiveRepayment(bytes32 loanId, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than 0");
        
        // The sender must transfer the stablecoin first or approve this contract
        require(stablecoin.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update pool metrics
        availableLiquidity += amount;
        totalRepaid += amount;
        
        emit RepaymentReceived(msg.sender, loanId, amount);
    }
    
    /**
     * @notice Covers a defaulted loan from the reserve fund
     * @dev Only callable by the waterfall contract
     * @param loanId Unique identifier for the loan
     * @param amount Amount to cover from default
     * @return covered The amount actually covered (may be less than requested if insufficient reserves)
     */
    function coverDefault(bytes32 loanId, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        onlyRole(WATERFALL_ROLE) 
        returns (uint256 covered) 
    {
        require(amount > 0, "Amount must be greater than 0");
        
        // Determine how much can be covered from the reserve fund
        covered = amount;
        if (covered > reserveFundBalance) {
            covered = reserveFundBalance;
        }
        
        if (covered > 0) {
            // Update pool metrics
            reserveFundBalance -= covered;
            totalDefaulted += covered;
            
            emit DefaultCovered(loanId, covered, covered);
            emit ReserveFundDecreased(covered, reserveFundBalance);
        }
        
        return covered;
    }
    
    /**
     * @notice Sets the reserve ratio for new deposits
     * @dev Only callable by operators
     * @param newRatio New reserve ratio (basis points, e.g. 500 = 5%)
     */
    function setReserveRatio(uint256 newRatio) external onlyRole(OPERATOR_ROLE) {
        require(newRatio <= 2000, "Reserve ratio too high"); // Max 20%
        
        uint256 oldRatio = reserveRatio;
        reserveRatio = newRatio;
        
        emit ReserveRatioChanged(oldRatio, newRatio);
    }
    
    /**
     * @notice Pauses all non-admin functions
     * @dev Only callable by operators
     */
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpauses all non-admin functions
     * @dev Only callable by operators
     */
    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Grants the Waterfall role to a contract
     * @dev Only callable by admin
     * @param waterfallContract Address of the waterfall contract
     */
    function setWaterfallContract(address waterfallContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(waterfallContract != address(0), "Invalid address");
        _setupRole(WATERFALL_ROLE, waterfallContract);
    }
    
    /**
     * @notice Grants the Loan Manager role to a contract
     * @dev Only callable by admin
     * @param loanManager Address of the loan manager contract
     */
    function setLoanManagerContract(address loanManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(loanManager != address(0), "Invalid address");
        _setupRole(LOAN_MANAGER_ROLE, loanManager);
    }
    
    /**
     * @notice Gets the total number of liquidity providers
     * @return Number of providers
     */
    function getProvidersCount() external view returns (uint256) {
        return providers.length;
    }
    
    /**
     * @notice Gets pool health metrics
     * @return metrics Array containing [totalLiquidity, availableLiquidity, totalLoaned, totalRepaid, totalDefaulted, reserveFundBalance]
     */
    function getPoolMetrics() external view returns (uint256[6] memory metrics) {
        return [
            totalLiquidity,
            availableLiquidity,
            totalLoaned,
            totalRepaid,
            totalDefaulted,
            reserveFundBalance
        ];
    }
    
    /**
     * @dev Removes a provider from the providers array
     * @param provider Address of the provider to remove
     */
    function _removeProvider(address provider) private {
        for (uint256 i = 0; i < providers.length; i++) {
            if (providers[i] == provider) {
                providers[i] = providers[providers.length - 1];
                providers.pop();
                break;
            }
        }
    }
}
