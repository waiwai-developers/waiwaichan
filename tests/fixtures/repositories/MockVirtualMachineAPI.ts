import type { IVirtualMachineAPI } from "@/src/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import { GCPComputeEngineInstanceRepositoryImpl } from "@/src/repositories/gcpapi/GCPComputeEngineInstanceRepositoryImpl";
import { anything, instance, mock, when } from "ts-mockito";

export const MockVirtualMachineAPI = () => {
	const mockedRepo = mock<IVirtualMachineAPI>();
	// https://github.com/NagRock/ts-mockito/issues/222
	when((mockedRepo as any).then).thenReturn(undefined);
	when(mockedRepo.start(anything())).thenResolve(true);
	when(mockedRepo.state(anything())).thenResolve(true);
	when(mockedRepo.stop(anything())).thenResolve(true);
	return instance(mockedRepo);
};

export const MockFailVirtualMachineAPI = () => {
	const mockedRepo = mock<IVirtualMachineAPI>();
	// https://github.com/NagRock/ts-mockito/issues/222
	when((mockedRepo as any).then).thenReturn(undefined);
	when(mockedRepo.start(anything())).thenResolve(false);
	when(mockedRepo.state(anything())).thenResolve(false);
	when(mockedRepo.stop(anything())).thenResolve(false);
	return instance(mockedRepo);
};
